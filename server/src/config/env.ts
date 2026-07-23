import dotenv from "dotenv";

dotenv.config();

function optional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

// On Vercel, prefer the deployment URL when APP_URL / API_URL aren't set yet
// (first deploy before custom domain / env are wired).
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  port: parseInt(optional("PORT", "4000"), 10),
  databaseUrl: optional("DATABASE_URL"),
  jwtSecret: optional("JWT_SECRET", "dev-insecure-secret-change-me"),
  jwtExpiresIn: optional("JWT_EXPIRES_IN", "7d"),
  appUrl: optional("APP_URL", vercelUrl || "http://localhost:5173"),
  apiUrl: optional("API_URL", vercelUrl || "http://localhost:4000"),

  // Email (nodemailer). If SMTP is not configured we log to console.
  smtpHost: optional("SMTP_HOST"),
  smtpPort: parseInt(optional("SMTP_PORT", "587"), 10),
  smtpUser: optional("SMTP_USER"),
  smtpPass: optional("SMTP_PASS"),
  mailFrom: optional("MAIL_FROM", "InvoiceFlow AI <no-reply@invoiceflow.ai>"),

  // Google OAuth
  googleClientId: optional("GOOGLE_CLIENT_ID"),

  // Stripe
  stripeSecretKey: optional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  stripePriceId: optional("STRIPE_PRICE_ID"),

  // OpenAI (optional — AI works without it via the rule-based parser)
  openaiApiKey: optional("OPENAI_API_KEY"),
  openaiModel: optional("OPENAI_MODEL", "gpt-4o-mini"),

  // Cron jobs (Vercel scheduled tasks)
  cronSecret: optional("CRON_SECRET"),

  // Error monitoring (optional)
  sentryDsn: optional("SENTRY_DSN"),
};

export const isProd = env.nodeEnv === "production";
export const isDev = env.nodeEnv === "development";
export const hasOpenAi = Boolean(env.openaiApiKey);
export const hasStripe = Boolean(env.stripeSecretKey);
export const hasSmtp = Boolean(env.smtpHost && env.smtpUser);

// Fail fast in production rather than running with an insecure signing key.
if (isProd) {
  if (!process.env.JWT_SECRET || env.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be set to a random value of at least 32 characters in production.");
  }
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL must be set in production.");
  }
}
