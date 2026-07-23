import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { dateLocaleTag, pdfLabels, resolveLocale } from "../lib/i18n.js";

interface PdfItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  unit?: string | null;
  lineTotal: number;
}

export interface InvoicePdfData {
  number: string;
  type: "INVOICE" | "CREDIT_NOTE";
  issueDate: Date;
  dueDate: Date;
  currency: string;
  locale?: string | null;
  company: {
    name: string;
    vatNumber?: string | null;
    address?: string | null;
    city?: string | null;
    zip?: string | null;
    country?: string | null;
    email?: string | null;
    phone?: string | null;
    logoUrl?: string | null;
    brandColor?: string | null;
    bankName?: string | null;
    bankAccount?: string | null;
    bankIban?: string | null;
    bankSwift?: string | null;
    paymentInstructions?: string | null;
    signature?: string | null;
  };
  customer: {
    name?: string | null;
    vat?: string | null;
    address?: string | null;
    email?: string | null;
  };
  items: PdfItem[];
  subtotal: number;
  discountTotal: number;
  vatTotal: number;
  total: number;
  notes?: string | null;
  footer?: string | null;
  payUrl?: string | null;
}

function money(n: number, currency: string, locale: string): string {
  return `${n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

/** Renders the invoice to a PDF and resolves with the resulting Buffer. */
export async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const locale = resolveLocale(data.locale);
  const tag = dateLocaleTag(locale);
  const L = pdfLabels(locale);
  const brand = data.company.brandColor || "#4f46e5";
  const muted = "#6b7280";
  const dark = "#111827";

  let qrDataUrl: string | null = null;
  if (data.payUrl) {
    try {
      qrDataUrl = await QRCode.toDataURL(data.payUrl, { margin: 1, width: 160 });
    } catch {
      qrDataUrl = null;
    }
  }

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const left = 50;
    const right = pageWidth - 50;
    const title = data.type === "CREDIT_NOTE" ? L.creditNote : L.invoice;

    // Header
    doc.fillColor(brand).fontSize(26).font("Helvetica-Bold").text(data.company.name, left, 50);
    doc
      .fillColor(muted)
      .fontSize(9)
      .font("Helvetica")
      .text(
        [
          data.company.address,
          [data.company.zip, data.company.city].filter(Boolean).join(" "),
          data.company.country,
          data.company.vatNumber ? `${L.vatCvr}: ${data.company.vatNumber}` : null,
          data.company.email,
          data.company.phone,
        ]
          .filter(Boolean)
          .join("\n"),
        left,
        84
      );

    doc.fillColor(dark).fontSize(28).font("Helvetica-Bold").text(title, right - 200, 50, { width: 200, align: "right" });
    doc
      .fillColor(muted)
      .fontSize(10)
      .font("Helvetica")
      .text(`${L.number} ${data.number}`, right - 200, 84, { width: 200, align: "right" })
      .text(`${L.issued}: ${formatDate(data.issueDate, tag)}`, { width: 200, align: "right" })
      .text(`${L.due}: ${formatDate(data.dueDate, tag)}`, { width: 200, align: "right" });

    // Bill to
    let y = 170;
    doc.fillColor(muted).fontSize(9).font("Helvetica-Bold").text(L.billTo, left, y);
    y += 14;
    doc.fillColor(dark).fontSize(11).font("Helvetica-Bold").text(data.customer.name || "—", left, y);
    y += 15;
    doc.fillColor(muted).fontSize(9).font("Helvetica");
    if (data.customer.address) {
      doc.text(data.customer.address, left, y);
      y += doc.heightOfString(data.customer.address, { width: 250 });
    }
    if (data.customer.vat) {
      doc.text(`${L.vatCvr}: ${data.customer.vat}`, left, y);
      y += 12;
    }
    if (data.customer.email) {
      doc.text(data.customer.email, left, y);
      y += 12;
    }

    // Items table
    let tableTop = Math.max(y + 20, 250);
    const colDesc = left;
    const colQty = 300;
    const colPrice = 360;
    const colVat = 440;
    const colTotal = 490;

    doc.rect(left, tableTop - 6, right - left, 22).fill(brand);
    doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
    doc.text(L.description, colDesc + 6, tableTop);
    doc.text(L.qty, colQty, tableTop, { width: 50, align: "right" });
    doc.text(L.price, colPrice, tableTop, { width: 70, align: "right" });
    doc.text(L.vat, colVat, tableTop, { width: 40, align: "right" });
    doc.text(L.amount, colTotal, tableTop, { width: right - colTotal - 6, align: "right" });

    let rowY = tableTop + 24;
    doc.font("Helvetica").fontSize(9);
    data.items.forEach((item, i) => {
      if (rowY > 700) {
        doc.addPage();
        rowY = 60;
      }
      if (i % 2 === 1) {
        doc.rect(left, rowY - 4, right - left, 20).fill("#f9fafb");
      }
      doc.fillColor(dark).text(item.description, colDesc + 6, rowY, { width: colQty - colDesc - 12 });
      const qtyLabel = item.unit ? `${item.quantity} ${item.unit}` : String(item.quantity);
      doc.fillColor(muted).text(qtyLabel, colQty, rowY, { width: 50, align: "right" });
      doc.text(money(item.unitPrice, data.currency, tag).replace(` ${data.currency}`, ""), colPrice, rowY, { width: 70, align: "right" });
      doc.text(`${item.vatRate}%`, colVat, rowY, { width: 40, align: "right" });
      doc.fillColor(dark).text(money(item.lineTotal, data.currency, tag).replace(` ${data.currency}`, ""), colTotal, rowY, {
        width: right - colTotal - 6,
        align: "right",
      });
      rowY += Math.max(20, doc.heightOfString(item.description, { width: colQty - colDesc - 12 }) + 8);
    });

    // Totals
    doc.moveTo(left, rowY + 4).lineTo(right, rowY + 4).strokeColor("#e5e7eb").stroke();
    let ty = rowY + 14;
    const labelX = 360;
    const valX = colTotal;
    const totalsLine = (label: string, value: string, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(bold ? dark : muted).fontSize(bold ? 12 : 10);
      doc.text(label, labelX, ty, { width: 100, align: "right" });
      doc.fillColor(dark).text(value, valX, ty, { width: right - valX - 6, align: "right" });
      ty += bold ? 22 : 16;
    };
    totalsLine(L.subtotal, money(data.subtotal, data.currency, tag));
    if (data.discountTotal > 0) totalsLine(L.discount, `-${money(data.discountTotal, data.currency, tag)}`);
    totalsLine(L.vat, money(data.vatTotal, data.currency, tag));
    doc.moveTo(labelX, ty).lineTo(right, ty).strokeColor("#e5e7eb").stroke();
    ty += 6;
    totalsLine(L.total, money(data.total, data.currency, tag), true);

    // Payment info + QR
    let py = ty + 24;
    doc.fillColor(muted).fontSize(9).font("Helvetica-Bold").text(L.payment, left, py);
    py += 14;
    doc.font("Helvetica").fillColor(dark).fontSize(9);
    const payLines = [
      data.company.bankName ? `${L.bank}: ${data.company.bankName}` : null,
      data.company.bankIban ? `${L.iban}: ${data.company.bankIban}` : null,
      data.company.bankAccount ? `${L.account}: ${data.company.bankAccount}` : null,
      data.company.bankSwift ? `${L.swift}: ${data.company.bankSwift}` : null,
      data.company.paymentInstructions,
    ].filter(Boolean) as string[];
    payLines.forEach((line) => {
      doc.text(line, left, py, { width: 300 });
      py += 12;
    });

    if (qrDataUrl) {
      const img = Buffer.from(qrDataUrl.split(",")[1], "base64");
      doc.image(img, right - 110, ty + 24, { width: 90 });
      doc.fillColor(muted).fontSize(8).text(L.scanToPay, right - 110, ty + 118, { width: 90, align: "center" });
    }

    // Notes / footer / signature
    let ny = Math.max(py, ty + 150) + 10;
    if (data.notes) {
      doc.fillColor(muted).fontSize(9).font("Helvetica-Bold").text(L.notes, left, ny);
      ny += 12;
      doc.font("Helvetica").fillColor(dark).text(data.notes, left, ny, { width: right - left });
      ny += doc.heightOfString(data.notes, { width: right - left }) + 10;
    }
    if (data.company.signature) {
      doc.font("Helvetica-Oblique").fillColor(muted).fontSize(9).text(data.company.signature, left, ny, { width: right - left });
    }

    const footerY = doc.page.height - doc.page.margins.bottom - 12;
    if (ny < footerY) {
      doc
        .fillColor(muted)
        .fontSize(8)
        .font("Helvetica")
        .text(data.footer || L.footer, left, footerY, { width: right - left, align: "center" });
    }

    doc.end();
  });
}
