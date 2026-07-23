/**
 * Rule-based natural-language invoice parser.
 *
 * This is the deterministic engine behind the AI invoice feature. It works
 * completely offline (no API key required) which keeps the promise that the
 * product is fully functional without AI. When an OpenAI key is configured,
 * `aiService` layers an LLM on top for fuzzier prompts and falls back to this.
 *
 * Supports English and Danish phrasing.
 */

export interface ParsedItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  unit?: string;
}

export interface ParsedInvoice {
  customerName: string | null;
  items: ParsedItem[];
  vatRate: number;
  paymentTermsDays: number;
  currency: string;
  notes: string | null;
  assumptions: string[];
  confidence: number;
}

const CURRENCY_MAP: Record<string, string> = {
  dkk: "DKK",
  kr: "DKK",
  "kr.": "DKK",
  eur: "EUR",
  "€": "EUR",
  usd: "USD",
  $: "USD",
  gbp: "GBP",
  "£": "GBP",
  sek: "SEK",
  nok: "NOK",
};

const UNIT_WORDS = [
  "hours",
  "hour",
  "hrs",
  "hr",
  "timers",
  "timer",
  "times",
  "time",
  "days",
  "day",
  "dages",
  "dage",
  "dags",
  "dag",
  "pcs",
  "pieces",
  "piece",
  "stk",
  "stk.",
  "units",
  "unit",
  "items",
  "item",
];

function num(raw: string): number {
  // Handle "1.500,50" (da) and "1,500.50" (en) and plain numbers.
  let s = raw.trim();
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // last separator is the decimal separator
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    // treat comma as decimal if 1-2 digits follow, else thousands
    if (/,\d{1,2}$/.test(s)) s = s.replace(",", ".");
    else s = s.replace(/,/g, "");
  }
  return parseFloat(s) || 0;
}

function detectCurrency(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(CURRENCY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function detectVat(text: string): number | null {
  const m = text.match(/(\d{1,2}(?:[.,]\d+)?)\s*%\s*(?:vat|moms)/i);
  if (m) return num(m[1]);
  const m2 = text.match(/(?:vat|moms)\s*(?:of|på|at)?\s*(\d{1,2}(?:[.,]\d+)?)\s*%/i);
  if (m2) return num(m2[1]);
  return null;
}

function detectPaymentTerms(text: string): number | null {
  const m = text.match(/(\d{1,3})[-\s]?(?:day|days|dage|dags?)\s*(?:payment|betaling|net|forfald)?/i);
  if (m) return parseInt(m[1], 10);
  const m2 = text.match(/net\s*(\d{1,3})/i);
  if (m2) return parseInt(m2[1], 10);
  const m3 = text.match(/(?:payment|betaling)\s*(?:terms?|frist)?\s*(?:of|på)?\s*(\d{1,3})/i);
  if (m3) return parseInt(m3[1], 10);
  return null;
}

function detectCustomer(text: string): string | null {
  // Keywords are matched case-insensitively, but the customer name capture
  // stays proper-noun aware (must start with an uppercase letter) so we don't
  // accidentally grab connective words like "for". À-Þ / À-ÿ cover accented
  // Latin letters (Café, Sørensen, Müller, …).
  const namePart = "([A-ZÀ-Þ][\\wÀ-ÿ'&.\\-]*(?:\\s+[A-ZÀ-Þ][\\wÀ-ÿ'&.\\-]*){0,3})";
  const patterns = [
    new RegExp(`(?:[Ii]nvoice|[Bb]ill|[Cc]harge|[Ff]aktur[ae]r?)\\s+(?:[Tt]il\\s+)?${namePart}`),
    new RegExp(`(?:[Ff]or|[Tt]il)\\s+(?:customer|kunde|client)\\s+${namePart}`),
  ];
  const stopWords = new Set(["For", "The", "About", "Regarding", "With", "And", "At"]);
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      let name = m[1].trim();
      // Drop trailing connective words the greedy capture may have grabbed.
      const words = name.split(/\s+/);
      while (words.length > 1 && stopWords.has(words[words.length - 1])) words.pop();
      name = words.join(" ");
      if (name.length > 1) return name;
    }
  }
  return null;
}

/**
 * Parse a single line-item chunk like:
 *   "12 hours of web development at 750 DKK/hour"
 *   "12 timers webudvikling til 750 kr/time"
 *   "web design for 5000"
 */
function parseItemChunk(chunk: string, defaultVat: number): ParsedItem | null {
  const text = chunk.trim();
  if (!text) return null;

  let quantity = 1;
  let unit: string | undefined;
  let unitPrice = 0;
  let description = text;

  const unitPattern = new RegExp(
    `(\\d+(?:[.,]\\d+)?)\\s*(${UNIT_WORDS.join("|")})\\b(?:\\s*(?:of|af|med)?\\s*)?`,
    "i"
  );
  const qtyMatch = text.match(unitPattern);
  if (qtyMatch) {
    quantity = num(qtyMatch[1]);
    unit = qtyMatch[2].toLowerCase();
  }

  // price: "at 750 DKK/hour", "til 750 kr", "@ 750", "for 5000", "750 kr/time"
  const pricePatterns = [
    /(?:at|@|til|a|à|for|of)\s*(\d[\d.,]*)\s*(?:dkk|kr\.?|eur|€|usd|\$|gbp|£|sek|nok)?\s*(?:\/|per|pr\.?|i\s)?\s*(?:hours?|hrs?|timers?|timen|times?|days?|dagen|dages?|dags?|pcs|stk|units?|items?)?/i,
    /(\d[\d.,]*)\s*(?:dkk|kr\.?|eur|€|usd|\$|gbp|£|sek|nok)\s*(?:\/|per|pr\.?|i\s)?\s*(?:hours?|hrs?|timers?|timen|times?|days?|dagen|dages?|dags?|pcs|stk|units?|items?)?/i,
  ];
  for (const p of pricePatterns) {
    const pm = text.match(p);
    if (pm) {
      unitPrice = num(pm[1]);
      break;
    }
  }

  // If there was no explicit quantity but there is a total price and it's a
  // flat fee, quantity stays 1.
  // Build a clean description: strip out the numeric/price/qty parts.
  description = text
    .replace(unitPattern, " ")
    .replace(/(?:at|@|til|a|à|for|of)\s*\d[\d.,]*\s*(?:dkk|kr\.?|eur|€|usd|\$|gbp|£|sek|nok)?\s*(?:\/|per|pr\.?|i\s)?\s*(?:hours?|hrs?|timers?|timen|times?|days?|dagen|dages?|dags?|pcs|stk|units?|items?)?/gi, " ")
    .replace(/\d[\d.,]*\s*(?:dkk|kr\.?|eur|€|usd|\$|gbp|£|sek|nok)\s*(?:\/|per|pr\.?)?\s*(?:hours?|hrs?|timers?|timen|times?|days?|dagen|dages?|dags?|pcs|stk|units?|items?)?/gi, " ")
    .replace(/\b(?:of|af|med|with|and|og)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Remove leading "for"
  description = description.replace(/^(?:for|til)\s+/i, "").trim();
  if (!description) description = "Service";
  // Capitalize
  description = description.charAt(0).toUpperCase() + description.slice(1);

  if (unitPrice === 0 && quantity === 1) {
    return null; // nothing usable
  }

  return {
    description,
    quantity,
    unitPrice,
    vatRate: defaultVat,
    unit,
  };
}

export function parseInvoicePrompt(prompt: string, defaults: { vatRate: number; paymentTermsDays: number; currency: string }): ParsedInvoice {
  const assumptions: string[] = [];
  const text = prompt.trim();

  const customerName = detectCustomer(text);
  if (!customerName) assumptions.push("Could not detect a customer name — please add one.");

  const currency = detectCurrency(text) ?? defaults.currency;
  if (!detectCurrency(text)) assumptions.push(`Assumed currency ${currency}.`);

  const vatRate = detectVat(text) ?? defaults.vatRate;
  if (detectVat(text) === null) assumptions.push(`Assumed default VAT of ${vatRate}%.`);

  const paymentTermsDays = detectPaymentTerms(text) ?? defaults.paymentTermsDays;
  if (detectPaymentTerms(text) === null)
    assumptions.push(`Assumed ${paymentTermsDays}-day payment terms.`);

  // Isolate the "work" portion: strip the customer/VAT/terms clauses.
  let workPart = text;
  // Cut off from VAT / payment clauses onward
  workPart = workPart.replace(/(?:with|med)?\s*\d{1,2}(?:[.,]\d+)?\s*%\s*(?:vat|moms)[\s\S]*$/i, " ");
  workPart = workPart.replace(/(?:and|og)?\s*\d{1,3}[-\s]?(?:day|days|dage|dags?)[\s\S]*$/i, " ");
  // Remove the leading "invoice <customer> for"
  workPart = workPart.replace(
    /^.*?(?:invoice|bill|charge|faktur[ae]r?)\s+[\wÀ-ÿ'&.\s-]*?\s+(?:for|til)\s+/i,
    ""
  );

  // Split into line-item chunks on "and"/"og"/"plus"/";" (but not inside numbers)
  const chunks = workPart
    .split(/\s*(?:,|;|\band\b|\bog\b|\bplus\b|\+)\s*/i)
    .map((c) => c.trim())
    .filter(Boolean);

  const items: ParsedItem[] = [];
  for (const chunk of chunks) {
    const item = parseItemChunk(chunk, vatRate);
    if (item) items.push(item);
  }

  if (items.length === 0) {
    // fall back: whole work part as a single flat-fee line if price found
    const single = parseItemChunk(workPart, vatRate);
    if (single) items.push(single);
  }

  if (items.length === 0) {
    assumptions.push("Could not detect line items — please add them manually.");
  }

  // Confidence heuristic
  let confidence = 0.4;
  if (customerName) confidence += 0.2;
  if (items.length > 0 && items.every((i) => i.unitPrice > 0)) confidence += 0.3;
  if (detectVat(text) !== null) confidence += 0.05;
  if (detectPaymentTerms(text) !== null) confidence += 0.05;
  confidence = Math.min(1, confidence);

  return {
    customerName,
    items,
    vatRate,
    paymentTermsDays,
    currency,
    notes: null,
    assumptions,
    confidence,
  };
}
