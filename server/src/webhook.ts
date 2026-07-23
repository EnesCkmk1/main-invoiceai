import type { Request, Response } from "express";
import { prisma } from "./lib/prisma.js";
import { stripe } from "./lib/stripe.js";
import { env } from "./config/env.js";

/**
 * Stripe webhook. Handles both invoice payments (customers paying an invoice)
 * and subscription lifecycle for the company's own InvoiceFlow plan.
 * Must be mounted with a raw body parser.
 */
export async function stripeWebhook(req: Request, res: Response) {
  if (!stripe || !env.stripeWebhookSecret) return res.status(503).send("Stripe not configured");
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, env.stripeWebhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return res.status(400).send("Invalid signature");
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        if (session.mode === "payment" && session.metadata?.invoiceId) {
          const invoice = await prisma.invoice.findUnique({ where: { id: session.metadata.invoiceId } });
          if (invoice) {
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                status: "PAID",
                amountPaid: invoice.total,
                paidAt: new Date(),
                payments: { create: { amount: invoice.total - invoice.amountPaid, method: "card", reference: session.payment_intent } },
                events: { create: { type: "PAID", meta: "stripe" } },
              },
            });
          }
        } else if (session.mode === "subscription" && session.metadata?.companyId) {
          await prisma.company.update({
            where: { id: session.metadata.companyId },
            data: { subscriptionStatus: "active", stripeSubscriptionId: session.subscription as string },
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const company = await prisma.company.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (company) {
          await prisma.company.update({ where: { id: company.id }, data: { subscriptionStatus: sub.status } });
        }
        break;
      }
    }
  } catch (err) {
    console.error("[webhook] handler error", err);
  }

  res.json({ received: true });
}
