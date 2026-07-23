import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { requireAuth, requireCompany } from "../middleware/auth.js";
import { computeTotals, nextInvoiceNumber, publicPayUrl, toPdfData } from "../services/invoiceService.js";
import { renderInvoicePdf } from "../services/pdf.js";
import { sendMail } from "../lib/mailer.js";

const router = Router();
router.use(requireAuth, requireCompany);

const itemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  vatRate: z.number(),
  unit: z.string().nullable().optional(),
});

const invoiceSchema = z.object({
  customerId: z.string().nullable().optional(),
  type: z.enum(["INVOICE", "CREDIT_NOTE"]).optional(),
  currency: z.string().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  paymentTermsDays: z.number().int().optional(),
  notes: z.string().nullable().optional(),
  footer: z.string().nullable().optional(),
  discountType: z.enum(["percent", "fixed"]).nullable().optional(),
  discountValue: z.number().optional(),
  recurrence: z.enum(["NONE", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).optional(),
  items: z.array(itemSchema).default([]),
  createdByAi: z.boolean().optional(),
  aiPrompt: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "SENT"]).optional(),
});

async function snapshotCustomer(companyId: string, customerId?: string | null) {
  if (!customerId) return { customerName: null, customerEmail: null, customerAddress: null, customerVat: null };
  const c = await prisma.customer.findFirst({ where: { id: customerId, companyId } });
  if (!c) return { customerName: null, customerEmail: null, customerAddress: null, customerVat: null };
  const address = [c.address, [c.zip, c.city].filter(Boolean).join(" "), c.country].filter(Boolean).join("\n");
  return { customerName: c.name, customerEmail: c.email, customerAddress: address, customerVat: c.vatNumber, paymentTermsDays: c.paymentTermsDays };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, q, customerId } = req.query as { status?: string; q?: string; customerId?: string };
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: req.user!.companyId!,
        ...(status ? { status: status as any } : {}),
        ...(customerId ? { customerId } : {}),
        ...(q ? { OR: [{ number: { contains: q, mode: "insensitive" } }, { customerName: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } }, items: true },
    });
    res.json({ invoices });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
      include: { items: { orderBy: { position: "asc" } }, customer: true, payments: true, events: { orderBy: { createdAt: "desc" } } },
    });
    if (!invoice) throw new ApiError(404, "Invoice not found");
    res.json({ invoice, payUrl: publicPayUrl(invoice.publicToken) });
  })
);

function computeDueDate(issue: Date, termsDays: number): Date {
  const d = new Date(issue);
  d.setDate(d.getDate() + termsDays);
  return d;
}

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = invoiceSchema.parse(req.body);
    const companyId = req.user!.companyId!;
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new ApiError(404, "Company not found");

    const snap = await snapshotCustomer(companyId, data.customerId);
    const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
    const termsDays = data.paymentTermsDays ?? (snap as any).paymentTermsDays ?? company.defaultPaymentTermsDays;
    const dueDate = data.dueDate ? new Date(data.dueDate) : computeDueDate(issueDate, termsDays);

    const totals = computeTotals(data.items, data.discountType, data.discountValue);
    const number = await nextInvoiceNumber(companyId);

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        customerId: data.customerId || null,
        number,
        type: data.type ?? "INVOICE",
        status: data.status ?? "DRAFT",
        currency: data.currency ?? company.defaultCurrency,
        issueDate,
        dueDate,
        customerName: snap.customerName,
        customerEmail: snap.customerEmail,
        customerAddress: snap.customerAddress,
        customerVat: snap.customerVat,
        notes: data.notes ?? company.invoiceNotes ?? null,
        footer: data.footer ?? null,
        discountType: data.discountType ?? null,
        discountValue: data.discountValue ?? 0,
        recurrence: data.recurrence ?? "NONE",
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        vatTotal: totals.vatTotal,
        total: totals.total,
        createdByAi: data.createdByAi ?? false,
        aiPrompt: data.aiPrompt ?? null,
        items: {
          create: data.items.map((item, idx) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            unit: item.unit ?? null,
            position: idx,
            lineTotal: totals.lineTotals[idx],
          })),
        },
        events: { create: { type: "CREATED", meta: data.createdByAi ? "ai" : "manual" } },
      },
      include: { items: true },
    });
    res.status(201).json({ invoice, payUrl: publicPayUrl(invoice.publicToken) });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = invoiceSchema.partial().parse(req.body);
    const companyId = req.user!.companyId!;
    const existing = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId } });
    if (!existing) throw new ApiError(404, "Invoice not found");
    if (existing.status === "PAID") throw new ApiError(400, "Paid invoices cannot be edited");

    const snap = data.customerId !== undefined ? await snapshotCustomer(companyId, data.customerId) : null;
    const items = data.items ?? undefined;
    const totals = items ? computeTotals(items, data.discountType ?? existing.discountType, data.discountValue ?? existing.discountValue) : null;

    const issueDate = data.issueDate ? new Date(data.issueDate) : existing.issueDate;
    const dueDate = data.dueDate
      ? new Date(data.dueDate)
      : data.paymentTermsDays
        ? computeDueDate(issueDate, data.paymentTermsDays)
        : existing.dueDate;

    const invoice = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
      }
      return tx.invoice.update({
        where: { id: existing.id },
        data: {
          customerId: data.customerId !== undefined ? data.customerId || null : undefined,
          ...(snap
            ? {
                customerName: snap.customerName,
                customerEmail: snap.customerEmail,
                customerAddress: snap.customerAddress,
                customerVat: snap.customerVat,
              }
            : {}),
          currency: data.currency ?? undefined,
          type: data.type ?? undefined,
          status: data.status ?? undefined,
          issueDate,
          dueDate,
          notes: data.notes ?? undefined,
          footer: data.footer ?? undefined,
          discountType: data.discountType ?? undefined,
          discountValue: data.discountValue ?? undefined,
          recurrence: data.recurrence ?? undefined,
          ...(totals
            ? {
                subtotal: totals.subtotal,
                discountTotal: totals.discountTotal,
                vatTotal: totals.vatTotal,
                total: totals.total,
                items: {
                  create: items!.map((item, idx) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    vatRate: item.vatRate,
                    unit: item.unit ?? null,
                    position: idx,
                    lineTotal: totals.lineTotals[idx],
                  })),
                },
              }
            : {}),
        },
        include: { items: { orderBy: { position: "asc" } } },
      });
    });
    res.json({ invoice });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) throw new ApiError(404, "Invoice not found");
    await prisma.invoice.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  })
);

// Duplicate
router.post(
  "/:id/duplicate",
  asyncHandler(async (req, res) => {
    const companyId = req.user!.companyId!;
    const src = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId }, include: { items: true } });
    if (!src) throw new ApiError(404, "Invoice not found");
    const number = await nextInvoiceNumber(companyId);
    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        customerId: src.customerId,
        number,
        type: src.type,
        status: "DRAFT",
        currency: src.currency,
        issueDate: new Date(),
        dueDate: computeDueDate(new Date(), 14),
        customerName: src.customerName,
        customerEmail: src.customerEmail,
        customerAddress: src.customerAddress,
        customerVat: src.customerVat,
        notes: src.notes,
        footer: src.footer,
        discountType: src.discountType,
        discountValue: src.discountValue,
        subtotal: src.subtotal,
        discountTotal: src.discountTotal,
        vatTotal: src.vatTotal,
        total: src.total,
        items: {
          create: src.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            vatRate: i.vatRate,
            unit: i.unit,
            position: i.position,
            lineTotal: i.lineTotal,
          })),
        },
        events: { create: { type: "CREATED", meta: "duplicate" } },
      },
      include: { items: true },
    });
    res.status(201).json({ invoice });
  })
);

// Credit note from an invoice
router.post(
  "/:id/credit-note",
  asyncHandler(async (req, res) => {
    const companyId = req.user!.companyId!;
    const src = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId }, include: { items: true } });
    if (!src) throw new ApiError(404, "Invoice not found");
    const number = await nextInvoiceNumber(companyId);
    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        customerId: src.customerId,
        number,
        type: "CREDIT_NOTE",
        status: "DRAFT",
        currency: src.currency,
        issueDate: new Date(),
        dueDate: new Date(),
        customerName: src.customerName,
        customerEmail: src.customerEmail,
        customerAddress: src.customerAddress,
        customerVat: src.customerVat,
        notes: `Credit note for ${src.number}`,
        creditForId: src.id,
        discountType: src.discountType,
        discountValue: src.discountValue,
        subtotal: -src.subtotal,
        discountTotal: -src.discountTotal,
        vatTotal: -src.vatTotal,
        total: -src.total,
        items: {
          create: src.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: -i.unitPrice,
            vatRate: i.vatRate,
            unit: i.unit,
            position: i.position,
            lineTotal: -i.lineTotal,
          })),
        },
        events: { create: { type: "CREATED", meta: "credit_note" } },
      },
      include: { items: true },
    });
    res.status(201).json({ invoice });
  })
);

// PDF download
router.get(
  "/:id/pdf",
  asyncHandler(async (req, res) => {
    const companyId = req.user!.companyId!;
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId }, include: { items: { orderBy: { position: "asc" } } } });
    if (!invoice) throw new ApiError(404, "Invoice not found");
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const pdf = await renderInvoicePdf(toPdfData(invoice, company, publicPayUrl(invoice.publicToken)));
    await prisma.invoiceEvent.create({ data: { invoiceId: invoice.id, type: "DOWNLOADED", meta: "owner" } });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${invoice.number}.pdf"`);
    res.send(pdf);
  })
);

// Send by email
router.post(
  "/:id/send",
  asyncHandler(async (req, res) => {
    const companyId = req.user!.companyId!;
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId }, include: { items: { orderBy: { position: "asc" } } } });
    if (!invoice) throw new ApiError(404, "Invoice not found");
    if (!invoice.customerEmail) throw new ApiError(400, "Customer has no email address");
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const pdf = await renderInvoicePdf(toPdfData(invoice, company, publicPayUrl(invoice.publicToken)));

    const subject = (company?.emailSubjectTemplate || `Invoice ${invoice.number} from ${company?.name}`)
      .replace("{number}", invoice.number)
      .replace("{company}", company?.name || "");
    const payUrl = publicPayUrl(invoice.publicToken);
    const body =
      (company?.emailBodyTemplate ||
        `<p>Hi ${invoice.customerName || "there"},</p><p>Please find attached invoice ${invoice.number} for ${invoice.total.toLocaleString()} ${invoice.currency}.</p><p>You can view and pay online here: <a href="${payUrl}">${payUrl}</a></p><p>Thank you!</p>`)
        .replace("{number}", invoice.number)
        .replace("{company}", company?.name || "")
        .replace("{payUrl}", payUrl);

    const { delivered } = await sendMail({
      to: invoice.customerEmail,
      subject,
      html: body,
      attachments: [{ filename: `${invoice.number}.pdf`, content: pdf, contentType: "application/pdf" }],
    });

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: invoice.status === "DRAFT" ? "SENT" : invoice.status,
        sentAt: invoice.sentAt ?? new Date(),
        events: { create: { type: "SENT", meta: delivered ? "email" : "console" } },
      },
      include: { items: true },
    });
    res.json({ invoice: updated, delivered, payUrl });
  })
);

// Mark paid manually
const markPaidSchema = z.object({ amount: z.number().optional(), method: z.string().optional() });
router.post(
  "/:id/mark-paid",
  asyncHandler(async (req, res) => {
    const companyId = req.user!.companyId!;
    const { amount, method } = markPaidSchema.parse(req.body);
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId } });
    if (!invoice) throw new ApiError(404, "Invoice not found");
    const payAmount = amount ?? invoice.total - invoice.amountPaid;
    const amountPaid = invoice.amountPaid + payAmount;
    const fullyPaid = amountPaid >= invoice.total - 0.001;
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid,
        status: fullyPaid ? "PAID" : "PARTIAL",
        paidAt: fullyPaid ? new Date() : invoice.paidAt,
        payments: { create: { amount: payAmount, method: method ?? "manual" } },
        events: { create: { type: "PAID", meta: method ?? "manual" } },
      },
      include: { items: true, payments: true },
    });
    res.json({ invoice: updated });
  })
);

// Status change (e.g. cancel)
const statusSchema = z.object({ status: z.enum(["DRAFT", "SENT", "VIEWED", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]) });
router.post(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    const existing = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) throw new ApiError(404, "Invoice not found");
    const invoice = await prisma.invoice.update({ where: { id: existing.id }, data: { status }, include: { items: true } });
    res.json({ invoice });
  })
);

// Send a reminder
router.post(
  "/:id/remind",
  asyncHandler(async (req, res) => {
    const companyId = req.user!.companyId!;
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, companyId } });
    if (!invoice) throw new ApiError(404, "Invoice not found");
    if (!invoice.customerEmail) throw new ApiError(400, "Customer has no email address");
    const payUrl = publicPayUrl(invoice.publicToken);
    const { delivered } = await sendMail({
      to: invoice.customerEmail,
      subject: `Reminder: invoice ${invoice.number} is due`,
      html: `<p>Hi ${invoice.customerName || "there"},</p><p>This is a friendly reminder that invoice ${invoice.number} for ${invoice.total.toLocaleString()} ${invoice.currency} is due on ${invoice.dueDate.toLocaleDateString()}.</p><p>Pay online: <a href="${payUrl}">${payUrl}</a></p>`,
    });
    await prisma.invoiceEvent.create({ data: { invoiceId: invoice.id, type: "REMINDER_SENT", meta: delivered ? "email" : "console" } });
    res.json({ ok: true, delivered });
  })
);

export default router;
