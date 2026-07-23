import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { env } from "../config/env.js";
import { sendInvoiceReminder } from "../services/reminderService.js";

const router = Router();

function assertCronAuth(req: { headers: { authorization?: string }; query: Record<string, unknown> }) {
  if (!env.cronSecret) {
    throw new ApiError(503, "Cron is not configured (CRON_SECRET missing)");
  }
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const querySecret = typeof req.query.secret === "string" ? req.query.secret : "";
  const provided = bearer || querySecret;
  if (!provided || provided !== env.cronSecret) {
    throw new ApiError(401, "Unauthorized");
  }
}

async function runOverdueReminders() {
  const now = new Date();
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["SENT", "VIEWED"] },
      dueDate: { lt: now },
      customerEmail: { not: null },
    },
    include: { company: true },
  });

  let sent = 0;
  let skipped = 0;
  const errors: { invoiceId: string; error: string }[] = [];

  for (const invoice of invoices) {
    try {
      const result = await sendInvoiceReminder(invoice, invoice.company);
      if (result.skipped) {
        skipped++;
        continue;
      }

      await prisma.$transaction([
        prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "OVERDUE" },
        }),
        prisma.invoiceEvent.create({
          data: {
            invoiceId: invoice.id,
            type: "REMINDER_SENT",
            meta: result.delivered ? "cron_email" : "cron_console",
          },
        }),
      ]);
      sent++;
    } catch (err) {
      errors.push({
        invoiceId: invoice.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return { checked: invoices.length, sent, skipped, errors };
}

const handleReminders = asyncHandler(async (req, res) => {
  assertCronAuth(req);
  const result = await runOverdueReminders();
  res.json({ ok: true, ...result });
});

router.post("/reminders", handleReminders);
// Vercel Cron invokes paths via GET — accept both methods.
router.get("/reminders", handleReminders);

export default router;
