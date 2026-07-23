export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  companyId: string | null;
}

export interface Company {
  id: string;
  name: string;
  vatNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  country: string;
  logoUrl?: string | null;
  brandColor: string;
  accentColor: string;
  bankName?: string | null;
  bankAccount?: string | null;
  bankIban?: string | null;
  bankSwift?: string | null;
  paymentInstructions?: string | null;
  defaultVatRate: number;
  defaultPaymentTermsDays: number;
  defaultCurrency: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  emailSubjectTemplate?: string | null;
  emailBodyTemplate?: string | null;
  invoiceNotes?: string | null;
  signature?: string | null;
  locale?: string;
  subscriptionStatus: string;
  trialEndsAt?: string | null;
  onboardingCompleted: boolean;
}

export interface Customer {
  id: string;
  name: string;
  vatNumber?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  country: string;
  paymentTermsDays?: number | null;
  notes?: string | null;
  tags: string[];
  createdAt: string;
  _count?: { invoices: number };
  invoices?: Invoice[];
}

export type InvoiceStatus = "DRAFT" | "SENT" | "VIEWED" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  unit?: string | null;
  position?: number;
  lineTotal?: number;
}

export interface InvoiceEvent {
  id: string;
  type: string;
  meta?: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  type: "INVOICE" | "CREDIT_NOTE";
  status: InvoiceStatus;
  currency: string;
  issueDate: string;
  dueDate: string;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  customerVat?: string | null;
  notes?: string | null;
  footer?: string | null;
  discountType?: string | null;
  discountValue: number;
  subtotal: number;
  vatTotal: number;
  discountTotal: number;
  total: number;
  amountPaid: number;
  recurrence: string;
  createdByAi: boolean;
  aiPrompt?: string | null;
  items: InvoiceItem[];
  customer?: { name: string } | null;
  events?: InvoiceEvent[];
  createdAt: string;
}

export interface ParsedDraft {
  customerName: string | null;
  items: InvoiceItem[];
  vatRate: number;
  paymentTermsDays: number;
  currency: string;
  notes: string | null;
  assumptions: string[];
  confidence: number;
  source?: "ai" | "rules";
}
