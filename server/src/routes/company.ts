import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { requireAuth, requireCompany } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireCompany);

const companySchema = z.object({
  name: z.string().min(1).optional(),
  vatNumber: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  country: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  brandColor: z.string().optional(),
  accentColor: z.string().optional(),
  bankName: z.string().nullable().optional(),
  bankAccount: z.string().nullable().optional(),
  bankIban: z.string().nullable().optional(),
  bankSwift: z.string().nullable().optional(),
  paymentInstructions: z.string().nullable().optional(),
  defaultVatRate: z.number().optional(),
  defaultPaymentTermsDays: z.number().int().optional(),
  defaultCurrency: z.string().optional(),
  invoicePrefix: z.string().optional(),
  nextInvoiceNumber: z.number().int().optional(),
  emailSubjectTemplate: z.string().nullable().optional(),
  emailBodyTemplate: z.string().nullable().optional(),
  invoiceNotes: z.string().nullable().optional(),
  signature: z.string().nullable().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const company = await prisma.company.findUnique({ where: { id: req.user!.companyId! } });
    if (!company) throw new ApiError(404, "Company not found");
    res.json({ company });
  })
);

router.put(
  "/",
  asyncHandler(async (req, res) => {
    const data = companySchema.parse(req.body);
    const company = await prisma.company.update({ where: { id: req.user!.companyId! }, data });
    res.json({ company });
  })
);

export default router;
