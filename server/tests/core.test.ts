import assert from "node:assert/strict";
import test from "node:test";
import { calcInvoice } from "../src/services/invoiceCalc.js";
import { parseInvoicePrompt } from "../src/services/aiParser.js";

test("calculates VAT and totals after a percentage discount", () => {
  const result = calcInvoice({
    items: [{ quantity: 2, unitPrice: 750, vatRate: 25 }],
    discountType: "percent",
    discountValue: 10,
  });

  assert.deepEqual(result, {
    subtotal: 1500,
    discountTotal: 150,
    vatTotal: 337.5,
    total: 1687.5,
    lineTotals: [1500],
  });
});

test("parses a Danish invoice prompt deterministically", () => {
  const result = parseInvoicePrompt(
    "Fakturer Anders Hansen for 12 timers webudvikling til 750 kr/time med 25% moms og 14 dages betaling",
    { vatRate: 25, paymentTermsDays: 8, currency: "DKK" },
  );

  assert.equal(result.customerName, "Anders Hansen");
  assert.equal(result.currency, "DKK");
  assert.equal(result.vatRate, 25);
  assert.equal(result.paymentTermsDays, 14);
  assert.equal(result.items[0]?.quantity, 12);
  assert.equal(result.items[0]?.unitPrice, 750);
});

test("keeps safe defaults when a prompt is incomplete", () => {
  const result = parseInvoicePrompt("Lav en faktura", {
    vatRate: 25,
    paymentTermsDays: 14,
    currency: "DKK",
  });

  assert.equal(result.currency, "DKK");
  assert.equal(result.vatRate, 25);
  assert.equal(result.paymentTermsDays, 14);
  assert.ok(result.assumptions.length >= 2);
});
