import { prisma } from "../lib/prisma.js";
import { calcInvoice } from "./invoiceCalc.js";
import type { InvoicePdfData } from "./pdf.js";
import { env } from "../config/env.js";

export interface ItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  unit?: string | null;
}

/** Generates the next sequential invoice number for a company atomically. */
export async function nextInvoiceNumber(companyId: string): Promise<string> {
  const company = await prisma.company.update({
    where: { id: companyId },
    data: { nextInvoiceNumber: { increment: 1 } },
    select: { invoicePrefix: true, nextInvoiceNumber: true },
  });
  const seq = company.nextInvoiceNumber - 1;
  const year = new Date().getFullYear();
  return `${company.invoicePrefix}-${year}-${String(seq).padStart(4, "0")}`;
}

export function computeTotals(items: ItemInput[], discountType?: string | null, discountValue?: number | null) {
  const calc = calcInvoice({ items, discountType, discountValue });
  return calc;
}

/** Maps a persisted invoice (with relations) into the PDF renderer's shape. */
export function toPdfData(invoice: any, company: any, payUrl?: string | null): InvoicePdfData {
  return {
    number: invoice.number,
    type: invoice.type,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    company: {
      name: company.name,
      vatNumber: company.vatNumber,
      address: company.address,
      city: company.city,
      zip: company.zip,
      country: company.country,
      email: company.email,
      phone: company.phone,
      logoUrl: company.logoUrl,
      brandColor: company.brandColor,
      bankName: company.bankName,
      bankAccount: company.bankAccount,
      bankIban: company.bankIban,
      bankSwift: company.bankSwift,
      paymentInstructions: company.paymentInstructions,
      signature: company.signature,
    },
    customer: {
      name: invoice.customerName,
      vat: invoice.customerVat,
      address: invoice.customerAddress,
      email: invoice.customerEmail,
    },
    items: invoice.items.map((i: any) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      vatRate: i.vatRate,
      unit: i.unit,
      lineTotal: i.lineTotal,
    })),
    subtotal: invoice.subtotal,
    discountTotal: invoice.discountTotal,
    vatTotal: invoice.vatTotal,
    total: invoice.total,
    notes: invoice.notes,
    footer: invoice.footer,
    payUrl,
    locale: company?.locale ?? "da",
  };
}

export function publicPayUrl(publicToken: string): string {
  return `${env.appUrl}/pay/${publicToken}`;
}
