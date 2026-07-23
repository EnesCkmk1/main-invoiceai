import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";
import { requireAuth, requireCompany } from "../middleware/auth.js";
import { hasOpenAi } from "../config/env.js";
import { improveDescription, parsePromptToInvoice, reviewInvoiceDraft, summariseRevenue } from "../services/aiService.js";

const router = Router();
router.use(requireAuth, requireCompany);

router.get("/status", (_req, res) => {
  res.json({ enabled: hasOpenAi, engine: hasOpenAi ? "openai+rules" : "rules" });
});

const parseSchema = z.object({ prompt: z.string().min(3) });

/**
 * Turn a natural-language prompt into a draft invoice. Also attempts to match
 * an existing customer by name so the UI can pre-select it. AI never persists
 * anything — the client shows the draft for confirmation first.
 */
router.post(
  "/parse-invoice",
  asyncHandler(async (req, res) => {
    const { prompt } = parseSchema.parse(req.body);
    const company = await prisma.company.findUnique({ where: { id: req.user!.companyId! } });
    const defaults = {
      vatRate: company?.defaultVatRate ?? 25,
      paymentTermsDays: company?.defaultPaymentTermsDays ?? 14,
      currency: company?.defaultCurrency ?? "DKK",
    };
    const parsed = await parsePromptToInvoice(prompt, defaults);

    let matchedCustomer = null;
    if (parsed.customerName) {
      matchedCustomer = await prisma.customer.findFirst({
        where: { companyId: req.user!.companyId!, name: { contains: parsed.customerName, mode: "insensitive" } },
      });
    }

    res.json({ draft: parsed, matchedCustomer });
  })
);

const improveSchema = z.object({ text: z.string().min(1) });
router.post(
  "/improve-description",
  asyncHandler(async (req, res) => {
    const { text } = improveSchema.parse(req.body);
    const improved = await improveDescription(text);
    res.json({ improved });
  })
);

const reviewSchema = z.object({
  customerName: z.string().nullable().optional(),
  customerEmail: z.string().nullable().optional(),
  paymentTermsDays: z.number().optional(),
  items: z.array(
    z.object({ description: z.string(), quantity: z.number(), unitPrice: z.number(), vatRate: z.number() })
  ),
});
router.post(
  "/review-invoice",
  asyncHandler(async (req, res) => {
    const draft = reviewSchema.parse(req.body);
    const issues = reviewInvoiceDraft(draft);
    res.json({ issues });
  })
);

router.get(
  "/monthly-summary",
  asyncHandler(async (req, res) => {
    const companyId = req.user!.companyId!;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const company = await prisma.company.findUnique({ where: { id: companyId } });

    const [paidThis, paidPrev, outstanding] = await Promise.all([
      prisma.invoice.aggregate({ _sum: { total: true }, _count: true, where: { companyId, status: "PAID", paidAt: { gte: start } } }),
      prisma.invoice.aggregate({ _sum: { total: true }, where: { companyId, status: "PAID", paidAt: { gte: prevStart, lt: start } } }),
      prisma.invoice.aggregate({ _sum: { total: true }, where: { companyId, status: { in: ["SENT", "VIEWED", "PARTIAL", "OVERDUE"] } } }),
    ]);

    const revenue = paidThis._sum.total ?? 0;
    const prevRevenue = paidPrev._sum.total ?? 0;
    const growthPct = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;
    const summary = await summariseRevenue({
      month: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      revenue,
      currency: company?.defaultCurrency ?? "DKK",
      paidCount: paidThis._count,
      outstanding: outstanding._sum.total ?? 0,
      growthPct,
    });
    res.json({ summary, revenue, growthPct, outstanding: outstanding._sum.total ?? 0 });
  })
);

export default router;
