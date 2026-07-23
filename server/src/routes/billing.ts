import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { requireAuth, requireCompany } from "../middleware/auth.js";
import { stripe } from "../lib/stripe.js";
import { env, hasStripe } from "../config/env.js";

const router = Router();

// Subscription status (InvoiceFlow's own 99 DKK/month plan)
router.get(
  "/status",
  requireAuth,
  requireCompany,
  asyncHandler(async (req, res) => {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId! },
      select: { subscriptionStatus: true, trialEndsAt: true, stripeSubscriptionId: true },
    });
    res.json({
      status: company?.subscriptionStatus ?? "trialing",
      trialEndsAt: company?.trialEndsAt,
      active: ["active", "trialing"].includes(company?.subscriptionStatus ?? "trialing"),
      billingEnabled: hasStripe,
      price: { amount: 99, currency: "DKK", interval: "month" },
    });
  })
);

// Start a subscription checkout
router.post(
  "/checkout",
  requireAuth,
  requireCompany,
  asyncHandler(async (req, res) => {
    if (!stripe || !env.stripePriceId) throw new ApiError(503, "Billing is not configured");
    const company = await prisma.company.findUnique({ where: { id: req.user!.companyId! } });
    if (!company) throw new ApiError(404, "Company not found");

    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ name: company.name, email: req.user!.email });
      customerId = customer.id;
      await prisma.company.update({ where: { id: company.id }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: env.stripePriceId, quantity: 1 }],
      success_url: `${env.appUrl}/app/settings?billing=success`,
      cancel_url: `${env.appUrl}/app/settings?billing=cancel`,
      metadata: { companyId: company.id },
    });
    res.json({ url: session.url });
  })
);

export default router;
