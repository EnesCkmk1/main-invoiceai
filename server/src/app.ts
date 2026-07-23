import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./lib/http.js";
import { stripeWebhook } from "./webhook.js";

import authRoutes from "./routes/auth.js";
import customerRoutes from "./routes/customers.js";
import invoiceRoutes from "./routes/invoices.js";
import companyRoutes from "./routes/company.js";
import aiRoutes from "./routes/ai.js";
import analyticsRoutes from "./routes/analytics.js";
import publicRoutes from "./routes/public.js";
import billingRoutes from "./routes/billing.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.appUrl,
      credentials: true,
    })
  );
  app.use(cookieParser());

  // Stripe webhook needs the raw body — register before the JSON parser.
  app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhook);

  app.use(express.json({ limit: "5mb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true, env: env.nodeEnv }));

  app.use("/api/auth", authRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api/invoices", invoiceRoutes);
  app.use("/api/company", companyRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api/billing", billingRoutes);

  app.use("/api", notFound);
  app.use(errorHandler);

  return app;
}
