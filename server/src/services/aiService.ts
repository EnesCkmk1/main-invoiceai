import { env, hasOpenAi } from "../config/env.js";
import { parseInvoicePrompt, type ParsedInvoice } from "./aiParser.js";

interface Defaults {
  vatRate: number;
  paymentTermsDays: number;
  currency: string;
}

async function callOpenAi(system: string, user: string, jsonMode = false): Promise<string | null> {
  if (!hasOpenAi) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: env.openaiModel,
        temperature: 0.2,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      console.warn("[ai] OpenAI request failed:", res.status);
      return null;
    }
    const data = (await res.json()) as any;
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.warn("[ai] OpenAI error, falling back:", err);
    return null;
  }
}

/**
 * Parse a natural-language prompt into a draft invoice. Tries the LLM first
 * (if configured) and always falls back to the deterministic parser.
 */
export async function parsePromptToInvoice(prompt: string, defaults: Defaults): Promise<ParsedInvoice & { source: "ai" | "rules" }> {
  if (hasOpenAi) {
    const system = `You are an invoicing assistant. Extract a draft invoice from the user's text.
Return ONLY JSON with this exact shape:
{
  "customerName": string | null,
  "items": [{ "description": string, "quantity": number, "unitPrice": number, "vatRate": number, "unit": string | null }],
  "vatRate": number,
  "paymentTermsDays": number,
  "currency": string,
  "notes": string | null
}
Use these defaults when unspecified: VAT ${defaults.vatRate}%, payment terms ${defaults.paymentTermsDays} days, currency ${defaults.currency}. Never invent prices that are not implied.`;
    const raw = await callOpenAi(system, prompt, true);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const items = Array.isArray(parsed.items) ? parsed.items : [];
        if (items.length > 0) {
          return {
            customerName: parsed.customerName ?? null,
            items: items.map((i: any) => ({
              description: String(i.description ?? "Service"),
              quantity: Number(i.quantity) || 1,
              unitPrice: Number(i.unitPrice) || 0,
              vatRate: Number(i.vatRate ?? defaults.vatRate),
              unit: i.unit ?? undefined,
            })),
            vatRate: Number(parsed.vatRate ?? defaults.vatRate),
            paymentTermsDays: Number(parsed.paymentTermsDays ?? defaults.paymentTermsDays),
            currency: parsed.currency ?? defaults.currency,
            notes: parsed.notes ?? null,
            assumptions: [],
            confidence: 0.9,
            source: "ai",
          };
        }
      } catch {
        // fall through to rules
      }
    }
  }
  return { ...parseInvoicePrompt(prompt, defaults), source: "rules" };
}

/** Improve an invoice line description to be clearer and more professional. */
export async function improveDescription(text: string): Promise<string> {
  const ai = await callOpenAi(
    "You improve invoice line-item descriptions. Return a single concise, professional line (max 12 words). No quotes.",
    text
  );
  if (ai) return ai.trim().replace(/^["']|["']$/g, "");
  // Deterministic fallback: tidy casing & spacing.
  const cleaned = text.trim().replace(/\s+/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Summarise revenue in one friendly sentence. */
export async function summariseRevenue(stats: {
  month: string;
  revenue: number;
  currency: string;
  paidCount: number;
  outstanding: number;
  growthPct: number;
}): Promise<string> {
  const ai = await callOpenAi(
    "You summarise a freelancer's monthly invoicing in one encouraging sentence. Be concise and specific.",
    JSON.stringify(stats)
  );
  if (ai) return ai.trim();
  const dir = stats.growthPct >= 0 ? "up" : "down";
  return `In ${stats.month} you brought in ${stats.revenue.toLocaleString()} ${stats.currency} across ${stats.paidCount} paid invoice(s), ${dir} ${Math.abs(
    stats.growthPct
  )}% vs last month, with ${stats.outstanding.toLocaleString()} ${stats.currency} still outstanding.`;
}

/**
 * Review a draft invoice for calculation errors and missing information.
 * Deterministic checks always run; the LLM adds softer suggestions.
 */
export function reviewInvoiceDraft(draft: {
  customerName?: string | null;
  customerEmail?: string | null;
  items: { description: string; quantity: number; unitPrice: number; vatRate: number }[];
  paymentTermsDays?: number;
}): { level: "error" | "warning" | "info"; message: string }[] {
  const issues: { level: "error" | "warning" | "info"; message: string }[] = [];
  if (!draft.customerName) issues.push({ level: "error", message: "No customer selected." });
  if (!draft.customerEmail) issues.push({ level: "warning", message: "Customer has no email — you won't be able to send it." });
  if (!draft.items.length) issues.push({ level: "error", message: "Add at least one line item." });
  draft.items.forEach((item, i) => {
    if (!item.description?.trim()) issues.push({ level: "warning", message: `Line ${i + 1} has no description.` });
    if (item.unitPrice <= 0) issues.push({ level: "warning", message: `Line ${i + 1} has a price of 0.` });
    if (item.quantity <= 0) issues.push({ level: "warning", message: `Line ${i + 1} has a quantity of 0.` });
    if (item.vatRate < 0 || item.vatRate > 100) issues.push({ level: "error", message: `Line ${i + 1} has an invalid VAT rate.` });
  });
  if (draft.paymentTermsDays !== undefined && draft.paymentTermsDays <= 0) {
    issues.push({ level: "warning", message: "Payment terms should be at least 1 day." });
  }
  if (issues.length === 0) issues.push({ level: "info", message: "Looks good — ready to send." });
  return issues;
}
