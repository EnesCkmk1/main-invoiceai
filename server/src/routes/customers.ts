import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { requireAuth, requireCompany } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireCompany);

const customerSchema = z.object({
  name: z.string().min(1),
  vatNumber: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  paymentTermsDays: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q, tag } = req.query as { q?: string; tag?: string };
    const customers = await prisma.customer.findMany({
      where: {
        companyId: req.user!.companyId!,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { contactPerson: { contains: q, mode: "insensitive" } },
                { vatNumber: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(tag ? { tags: { has: tag } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { invoices: true } } },
    });
    res.json({ customers });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId! },
      include: { invoices: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!customer) throw new ApiError(404, "Customer not found");
    res.json({ customer });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = customerSchema.parse(req.body);
    const customer = await prisma.customer.create({
      data: {
        companyId: req.user!.companyId!,
        name: data.name,
        vatNumber: data.vatNumber || null,
        contactPerson: data.contactPerson || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        zip: data.zip || null,
        country: data.country || "Denmark",
        paymentTermsDays: data.paymentTermsDays ?? null,
        notes: data.notes || null,
        tags: data.tags ?? [],
      },
    });
    res.status(201).json({ customer });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = customerSchema.partial().parse(req.body);
    const existing = await prisma.customer.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) throw new ApiError(404, "Customer not found");
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        ...data,
        country: data.country ?? undefined,
        email: data.email === "" ? null : data.email ?? undefined,
      },
    });
    res.json({ customer });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.customer.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    if (!existing) throw new ApiError(404, "Customer not found");
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

export default router;
