import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { renderInvoicePdf } from "../services/pdf.js";
import { toPdfData } from "../services/invoiceService.js";
import { stripe } from "../lib/stripe.js";
import { env, hasStripe, isProd } from "../config/env.js";

const router = Router();

async function loadByToken(token: string) {
  return prisma.invoice.findUnique({
    where: { publicToken: token },
    include: { items: { orderBy: { position: "asc" } }, company: true },
  });
}

// Public invoice view (also records an "opened" event)
router.get(
  "/invoice/:token",
  asyncHandler(async (req, res) => {
    const invoice = await loadByToken(String(req.params.token));
    if (!invoice) throw new ApiError(404, "Invoice not found");

    if (invoice.status === "SENT" && !invoice.viewedAt) {
      await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "VIEWED", viewedAt: new Date() } });
    }
    await prisma.invoiceEvent.create({ data: { invoiceId: invoice.id, type: "OPENED", meta: "public" } });

    res.json({
      invoice: {
        number: invoice.number,
        type: invoice.type,
        status: invoice.status,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        customerName: invoice.customerName,
        customerAddress: invoice.customerAddress,
        customerVat: invoice.customerVat,
        items: invoice.items,
        subtotal: invoice.subtotal,
        discountTotal: invoice.discountTotal,
        vatTotal: invoice.vatTotal,
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        notes: invoice.notes,
        footer: invoice.footer,
      },
      company: {
        name: invoice.company.name,
        logoUrl: invoice.company.logoUrl,
        brandColor: invoice.company.brandColor,
        vatNumber: invoice.company.vatNumber,
        bankName: invoice.company.bankName,
        bankIban: invoice.company.bankIban,
        bankAccount: invoice.company.bankAccount,
        bankSwift: invoice.company.bankSwift,
        paymentInstructions: invoice.company.paymentInstructions,
      },
      paymentEnabled: hasStripe,
    });
  })
);

// Public PDF download
router.get(
  "/invoice/:token/pdf",
  asyncHandler(async (req, res) => {
    const invoice = await loadByToken(String(req.params.token));
    if (!invoice) throw new ApiError(404, "Invoice not found");
    const pdf = await renderInvoicePdf(toPdfData(invoice, invoice.company, `${env.appUrl}/pay/${invoice.publicToken}`));
    await prisma.invoiceEvent.create({ data: { invoiceId: invoice.id, type: "DOWNLOADED", meta: "public" } });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice.number}.pdf"`);
    res.send(pdf);
  })
);

// Create a Stripe Checkout session to pay an invoice
router.post(
  "/invoice/:token/pay",
  asyncHandler(async (req, res) => {
    const invoice = await loadByToken(String(req.params.token));
    if (!invoice) throw new ApiError(404, "Invoice not found");
    if (invoice.status === "PAID") throw new ApiError(400, "Invoice already paid");
    if (!stripe) throw new ApiError(503, "Online payments are not configured");

    const amountDue = Math.round((invoice.total - invoice.amountPaid) * 100);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase(),
            product_data: { name: `Invoice ${invoice.number}` },
            unit_amount: amountDue,
          },
          quantity: 1,
        },
      ],
      metadata: { invoiceId: invoice.id },
      success_url: `${env.appUrl}/pay/${invoice.publicToken}?paid=1`,
      cancel_url: `${env.appUrl}/pay/${invoice.publicToken}`,
    });
    res.json({ url: session.url });
  })
);

// Simulate payment (dev/testing without Stripe). Never available in
// production — otherwise anyone with the link could mark an invoice paid.
const simulateSchema = z.object({ method: z.string().optional() });
router.post(
  "/invoice/:token/simulate-pay",
  asyncHandler(async (req, res) => {
    if (isProd) throw new ApiError(403, "Not available");
    const { method } = simulateSchema.parse(req.body);
    const invoice = await loadByToken(String(req.params.token));
    if (!invoice) throw new ApiError(404, "Invoice not found");
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        amountPaid: invoice.total,
        paidAt: new Date(),
        payments: { create: { amount: invoice.total - invoice.amountPaid, method: method ?? "card" } },
        events: { create: { type: "PAID", meta: "simulated" } },
      },
    });
    res.json({ ok: true, status: updated.status });
  })
);

export default router;
