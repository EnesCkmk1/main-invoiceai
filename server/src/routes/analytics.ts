import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";
import { requireAuth, requireCompany } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireCompany);

// Dashboard summary + recent activity + revenue graph
router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const companyId = req.user!.companyId!;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyRevenue, outstanding, paidCount, recentInvoices, upcoming] = await Promise.all([
      prisma.invoice.aggregate({ _sum: { total: true }, where: { companyId, status: "PAID", paidAt: { gte: monthStart } } }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        _count: true,
        where: { companyId, status: { in: ["SENT", "VIEWED", "PARTIAL", "OVERDUE"] } },
      }),
      prisma.invoice.count({ where: { companyId, status: "PAID" } }),
      prisma.invoice.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { customer: { select: { name: true } } },
      }),
      prisma.invoice.findMany({
        where: { companyId, status: { in: ["SENT", "VIEWED", "PARTIAL"] }, dueDate: { gte: now } },
        orderBy: { dueDate: "asc" },
        take: 5,
        include: { customer: { select: { name: true } } },
      }),
    ]);

    // Revenue graph — last 6 months
    const months: { label: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const agg = await prisma.invoice.aggregate({
        _sum: { total: true },
        where: { companyId, status: "PAID", paidAt: { gte: start, lt: end } },
      });
      months.push({ label: start.toLocaleDateString("en-US", { month: "short" }), revenue: agg._sum.total ?? 0 });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { defaultCurrency: true } });

    res.json({
      currency: company?.defaultCurrency ?? "DKK",
      monthlyRevenue: monthlyRevenue._sum.total ?? 0,
      outstanding: outstanding._sum.total ?? 0,
      outstandingCount: outstanding._count,
      paidCount,
      revenueGraph: months,
      recentInvoices,
      upcoming,
    });
  })
);

// Full analytics page
router.get(
  "/overview",
  asyncHandler(async (req, res) => {
    const companyId = req.user!.companyId!;
    const now = new Date();

    const [totalPaid, avgAgg, overdue, topCustomersRaw, all] = await Promise.all([
      prisma.invoice.aggregate({ _sum: { total: true }, where: { companyId, status: "PAID" } }),
      prisma.invoice.aggregate({ _avg: { total: true }, where: { companyId, status: { not: "DRAFT" } } }),
      prisma.invoice.findMany({
        where: { companyId, status: { in: ["SENT", "VIEWED", "PARTIAL", "OVERDUE"] }, dueDate: { lt: now } },
        include: { customer: { select: { name: true } } },
        orderBy: { dueDate: "asc" },
      }),
      prisma.invoice.groupBy({
        by: ["customerId"],
        where: { companyId, status: "PAID", customerId: { not: null } },
        _sum: { total: true },
        _count: true,
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),
      prisma.invoice.findMany({
        where: { companyId, status: "PAID", sentAt: { not: null }, paidAt: { not: null } },
        select: { sentAt: true, paidAt: true },
      }),
    ]);

    // Average payment speed (days)
    let avgPaymentDays = 0;
    if (all.length) {
      const totalDays = all.reduce((sum, inv) => {
        const days = (inv.paidAt!.getTime() - inv.sentAt!.getTime()) / (1000 * 60 * 60 * 24);
        return sum + Math.max(0, days);
      }, 0);
      avgPaymentDays = Math.round((totalDays / all.length) * 10) / 10;
    }

    const topCustomers = await Promise.all(
      topCustomersRaw.map(async (row) => {
        const customer = row.customerId ? await prisma.customer.findUnique({ where: { id: row.customerId }, select: { name: true } }) : null;
        return { name: customer?.name ?? "Unknown", total: row._sum.total ?? 0, count: row._count };
      })
    );

    // Monthly growth (12 months)
    const monthly: { label: string; revenue: number; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const agg = await prisma.invoice.aggregate({
        _sum: { total: true },
        _count: true,
        where: { companyId, status: "PAID", paidAt: { gte: start, lt: end } },
      });
      monthly.push({ label: start.toLocaleDateString("en-US", { month: "short" }), revenue: agg._sum.total ?? 0, count: agg._count });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { defaultCurrency: true } });

    res.json({
      currency: company?.defaultCurrency ?? "DKK",
      totalRevenue: totalPaid._sum.total ?? 0,
      averageInvoiceValue: Math.round((avgAgg._avg.total ?? 0) * 100) / 100,
      avgPaymentDays,
      overdue: overdue.map((o) => ({ id: o.id, number: o.number, customer: o.customer?.name ?? o.customerName, total: o.total, dueDate: o.dueDate })),
      overdueTotal: overdue.reduce((s, o) => s + o.total, 0),
      topCustomers,
      monthly,
    });
  })
);

export default router;
