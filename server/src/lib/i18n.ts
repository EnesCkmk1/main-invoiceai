export type ServerLocale = "da" | "en";

export function resolveLocale(locale?: string | null): ServerLocale {
  return locale === "en" ? "en" : "da";
}

export interface PdfLabels {
  invoice: string;
  creditNote: string;
  vatCvr: string;
  number: string;
  issued: string;
  due: string;
  billTo: string;
  description: string;
  qty: string;
  price: string;
  vat: string;
  amount: string;
  subtotal: string;
  discount: string;
  total: string;
  payment: string;
  bank: string;
  iban: string;
  account: string;
  swift: string;
  scanToPay: string;
  notes: string;
  footer: string;
}

const PDF_LABELS: Record<ServerLocale, PdfLabels> = {
  da: {
    invoice: "FAKTURA",
    creditNote: "KREDITNOTA",
    vatCvr: "CVR/Moms",
    number: "Nr.",
    issued: "Udstedt",
    due: "Forfald",
    billTo: "FAKTURERES TIL",
    description: "BESKRIVELSE",
    qty: "ANTAL",
    price: "PRIS",
    vat: "MOMS",
    amount: "BELØB",
    subtotal: "Subtotal",
    discount: "Rabat",
    total: "Total",
    payment: "BETALING",
    bank: "Bank",
    iban: "IBAN",
    account: "Konto",
    swift: "SWIFT/BIC",
    scanToPay: "Scan for at betale",
    notes: "NOTER",
    footer: "Tak for din forretning.",
  },
  en: {
    invoice: "INVOICE",
    creditNote: "CREDIT NOTE",
    vatCvr: "VAT/CVR",
    number: "No.",
    issued: "Issued",
    due: "Due",
    billTo: "BILL TO",
    description: "DESCRIPTION",
    qty: "QTY",
    price: "PRICE",
    vat: "VAT",
    amount: "AMOUNT",
    subtotal: "Subtotal",
    discount: "Discount",
    total: "Total",
    payment: "PAYMENT",
    bank: "Bank",
    iban: "IBAN",
    account: "Account",
    swift: "SWIFT/BIC",
    scanToPay: "Scan to pay",
    notes: "NOTES",
    footer: "Thank you for your business.",
  },
};

export function pdfLabels(locale?: string | null): PdfLabels {
  return PDF_LABELS[resolveLocale(locale)];
}

export function defaultInvoiceEmailSubject(locale: ServerLocale, number: string, company: string): string {
  if (locale === "en") return `Invoice ${number} from ${company}`;
  return `Faktura ${number} fra ${company}`;
}

export function defaultInvoiceEmailBody(
  locale: ServerLocale,
  customerName: string | null | undefined,
  number: string,
  total: number,
  currency: string,
  payUrl: string
): string {
  const name = customerName || (locale === "en" ? "there" : "dig");
  const amount = total.toLocaleString(locale === "en" ? "en-GB" : "da-DK");
  if (locale === "en") {
    return `<p>Hi ${name},</p><p>Please find attached invoice ${number} for ${amount} ${currency}.</p><p>You can view and pay online here: <a href="${payUrl}">${payUrl}</a></p><p>Thank you!</p>`;
  }
  return `<p>Hej ${name},</p><p>Vedhæftet finder du faktura ${number} på ${amount} ${currency}.</p><p>Du kan se og betale online her: <a href="${payUrl}">${payUrl}</a></p><p>Tak!</p>`;
}

export function defaultReminderEmailSubject(locale: ServerLocale, number: string): string {
  if (locale === "en") return `Reminder: invoice ${number} is due`;
  return `Påmindelse: faktura ${number} forfalder`;
}

export function defaultReminderEmailBody(
  locale: ServerLocale,
  customerName: string | null | undefined,
  number: string,
  total: number,
  currency: string,
  dueDate: Date,
  payUrl: string
): string {
  const name = customerName || (locale === "en" ? "there" : "dig");
  const amount = total.toLocaleString(locale === "en" ? "en-GB" : "da-DK");
  const due = dueDate.toLocaleDateString(locale === "en" ? "en-GB" : "da-DK");
  if (locale === "en") {
    return `<p>Hi ${name},</p><p>This is a friendly reminder that invoice ${number} for ${amount} ${currency} is due on ${due}.</p><p>Pay online: <a href="${payUrl}">${payUrl}</a></p>`;
  }
  return `<p>Hej ${name},</p><p>Dette er en venlig påmindelse om, at faktura ${number} på ${amount} ${currency} forfalder ${due}.</p><p>Betal online: <a href="${payUrl}">${payUrl}</a></p>`;
}

export function dateLocaleTag(locale: ServerLocale): string {
  return locale === "en" ? "en-GB" : "da-DK";
}
