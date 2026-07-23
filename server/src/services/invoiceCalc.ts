export interface CalcItem {
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface CalcInput {
  items: CalcItem[];
  discountType?: string | null;
  discountValue?: number | null;
}

export interface CalcResult {
  subtotal: number;
  discountTotal: number;
  vatTotal: number;
  total: number;
  lineTotals: number[];
}

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Computes invoice totals. Discount is applied proportionally across lines
 * before VAT so that VAT is charged on the discounted amount (EU standard).
 */
export function calcInvoice(input: CalcInput): CalcResult {
  const items = input.items ?? [];
  const lineTotals = items.map((i) => round((i.quantity || 0) * (i.unitPrice || 0)));
  const subtotal = round(lineTotals.reduce((a, b) => a + b, 0));

  let discountTotal = 0;
  if (input.discountType === "percent" && input.discountValue) {
    discountTotal = round(subtotal * (input.discountValue / 100));
  } else if (input.discountType === "fixed" && input.discountValue) {
    discountTotal = round(Math.min(input.discountValue, subtotal));
  }

  const discountFactor = subtotal > 0 ? (subtotal - discountTotal) / subtotal : 1;

  let vatTotal = 0;
  items.forEach((item, idx) => {
    const discountedLine = lineTotals[idx] * discountFactor;
    vatTotal += discountedLine * ((item.vatRate || 0) / 100);
  });
  vatTotal = round(vatTotal);

  const total = round(subtotal - discountTotal + vatTotal);

  return { subtotal, discountTotal, vatTotal, total, lineTotals };
}
