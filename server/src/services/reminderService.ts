import { sendMail } from "../lib/mailer.js";
import { defaultReminderEmailBody, defaultReminderEmailSubject, resolveLocale } from "../lib/i18n.js";
import { publicPayUrl } from "./invoiceService.js";

type InvoiceLike = {
  id: string;
  number: string;
  customerName: string | null;
  customerEmail: string | null;
  total: number;
  currency: string;
  dueDate: Date;
  publicToken: string;
};

type CompanyLike = {
  name: string;
  locale?: string | null;
  emailSubjectTemplate: string | null;
  emailBodyTemplate: string | null;
} | null;

/** Default subject/body for overdue payment reminders (Danish by default). */
export function buildReminderEmail(invoice: InvoiceLike, company: CompanyLike) {
  const payUrl = publicPayUrl(invoice.publicToken);
  const companyName = company?.name || "InvoiceFlow AI";
  const locale = resolveLocale(company?.locale);

  const subject = (
    company?.emailSubjectTemplate
      ? company.emailSubjectTemplate.replace("{number}", invoice.number).replace("{company}", companyName)
      : defaultReminderEmailSubject(locale, invoice.number)
  ).replace("{number}", invoice.number).replace("{company}", companyName);

  const html = (
    company?.emailBodyTemplate
      ? company.emailBodyTemplate
          .replace("{number}", invoice.number)
          .replace("{company}", companyName)
          .replace("{payUrl}", payUrl)
      : defaultReminderEmailBody(locale, invoice.customerName, invoice.number, invoice.total, invoice.currency, invoice.dueDate, payUrl)
  )
    .replace("{number}", invoice.number)
    .replace("{company}", companyName)
    .replace("{payUrl}", payUrl);

  return { subject, html, payUrl };
}

export async function sendInvoiceReminder(invoice: InvoiceLike, company: CompanyLike) {
  if (!invoice.customerEmail) {
    return { delivered: false, skipped: true as const, reason: "no_email" as const };
  }

  const { subject, html } = buildReminderEmail(invoice, company);
  const { delivered } = await sendMail({
    to: invoice.customerEmail,
    subject,
    html,
  });

  return { delivered, skipped: false as const };
}
