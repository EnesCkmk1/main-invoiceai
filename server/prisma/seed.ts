import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const email = "demo@invoiceflow.ai";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo data already exists. Skipping.");
    return;
  }

  const company = await prisma.company.create({
    data: {
      name: "Nordic Studio ApS",
      vatNumber: "DK12345678",
      email: "hello@nordicstudio.dk",
      phone: "+45 12 34 56 78",
      address: "Vestergade 12",
      city: "Copenhagen",
      zip: "1456",
      country: "Denmark",
      brandColor: "#4f46e5",
      accentColor: "#0ea5e9",
      bankName: "Danske Bank",
      bankIban: "DK5000400440116243",
      bankSwift: "DABADKKK",
      paymentInstructions: "Please reference the invoice number when paying.",
      defaultVatRate: 25,
      defaultPaymentTermsDays: 14,
      defaultCurrency: "DKK",
      invoicePrefix: "INV",
      nextInvoiceNumber: 1,
      signature: "Best regards,\nThe Nordic Studio team",
      subscriptionStatus: "trialing",
      trialEndsAt: daysFromNow(14),
    },
  });

  await prisma.user.create({
    data: {
      name: "Demo User",
      email,
      passwordHash: await bcrypt.hash("password123", 10),
      emailVerified: true,
      companyId: company.id,
    },
  });

  const customers = await Promise.all(
    [
      { name: "Anders Hansen", email: "anders@hansenweb.dk", contactPerson: "Anders Hansen", vatNumber: "DK87654321", tags: ["web", "retainer"] },
      { name: "Bygma A/S", email: "faktura@bygma.dk", contactPerson: "Mette Sørensen", vatNumber: "DK11223344", tags: ["construction"] },
      { name: "Café Solsikke", email: "kontakt@solsikke.dk", contactPerson: "Louise Berg", tags: ["hospitality"] },
    ].map((c) =>
      prisma.customer.create({
        data: { ...c, companyId: company.id, country: "Denmark", city: "Copenhagen" },
      })
    )
  );

  // A paid invoice
  const inv1Items = [{ description: "Web development", quantity: 12, unitPrice: 750, vatRate: 25, unit: "hours" }];
  const sub1 = 12 * 750;
  await prisma.invoice.create({
    data: {
      companyId: company.id,
      customerId: customers[0].id,
      number: "INV-2025-0001",
      status: "PAID",
      currency: "DKK",
      issueDate: daysFromNow(-30),
      dueDate: daysFromNow(-16),
      sentAt: daysFromNow(-30),
      paidAt: daysFromNow(-22),
      amountPaid: sub1 * 1.25,
      customerName: customers[0].name,
      customerEmail: customers[0].email,
      customerVat: customers[0].vatNumber,
      subtotal: sub1,
      vatTotal: sub1 * 0.25,
      total: sub1 * 1.25,
      items: { create: inv1Items.map((i, idx) => ({ ...i, position: idx, lineTotal: i.quantity * i.unitPrice })) },
      events: { create: [{ type: "CREATED", meta: "manual" }, { type: "SENT" }, { type: "PAID" }] },
    },
  });

  // An outstanding (sent) invoice
  const inv2Items = [{ description: "Brand identity package", quantity: 1, unitPrice: 18000, vatRate: 25, unit: "pcs" }];
  await prisma.invoice.create({
    data: {
      companyId: company.id,
      customerId: customers[1].id,
      number: "INV-2025-0002",
      status: "SENT",
      currency: "DKK",
      issueDate: daysFromNow(-5),
      dueDate: daysFromNow(9),
      sentAt: daysFromNow(-5),
      customerName: customers[1].name,
      customerEmail: customers[1].email,
      customerVat: customers[1].vatNumber,
      subtotal: 18000,
      vatTotal: 4500,
      total: 22500,
      createdByAi: true,
      aiPrompt: "Invoice Bygma for a brand identity package at 18000 DKK with 25% VAT",
      items: { create: inv2Items.map((i, idx) => ({ ...i, position: idx, lineTotal: i.quantity * i.unitPrice })) },
      events: { create: [{ type: "CREATED", meta: "ai" }, { type: "SENT" }] },
    },
  });

  // An overdue invoice
  const inv3Items = [{ description: "Menu design", quantity: 6, unitPrice: 900, vatRate: 25, unit: "hours" }];
  const sub3 = 6 * 900;
  await prisma.invoice.create({
    data: {
      companyId: company.id,
      customerId: customers[2].id,
      number: "INV-2025-0003",
      status: "OVERDUE",
      currency: "DKK",
      issueDate: daysFromNow(-40),
      dueDate: daysFromNow(-10),
      sentAt: daysFromNow(-40),
      customerName: customers[2].name,
      customerEmail: customers[2].email,
      subtotal: sub3,
      vatTotal: sub3 * 0.25,
      total: sub3 * 1.25,
      items: { create: inv3Items.map((i, idx) => ({ ...i, position: idx, lineTotal: i.quantity * i.unitPrice })) },
      events: { create: [{ type: "CREATED" }, { type: "SENT" }] },
    },
  });

  await prisma.company.update({ where: { id: company.id }, data: { nextInvoiceNumber: 4 } });

  console.log("Seed complete. Login with demo@invoiceflow.ai / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
