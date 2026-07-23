import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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

  // Behind a reverse proxy (nginx / cloud load balancer) in production —
  // required for express-rate-limit to see real client IPs.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      // The API serves JSON only; the SPA is served separately.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    cors({
      origin: env.appUrl,
      credentials: true,
    })
  );
  app.use(cookieParser());

  // Global limiter: generous enough for normal app usage.
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    })
  );

  // Strict limiter for credential/token endpoints (brute-force protection).
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many attempts. Please try again later." },
  });
  app.use(
    ["/api/auth/login", "/api/auth/register", "/api/auth/magic-link", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/google"],
    authLimiter
  );

  // AI endpoints are comparatively expensive — keep a moderate cap.
  app.use(
    "/api/ai",
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: "draft-8", legacyHeaders: false })
  );

  // Stripe webhook needs the raw body — register before the JSON parser.
  app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhook);

  app.use(express.json({ limit: "1mb" }));

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
