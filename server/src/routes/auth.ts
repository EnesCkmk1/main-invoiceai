import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { sendMail } from "../lib/mailer.js";
import { env, isDev } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/** One-time tokens are stored hashed so a DB leak can't be replayed as a login. */
function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function publicUser(user: { id: string; email: string; name: string; avatarUrl: string | null; companyId: string | null }) {
  return { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, companyId: user.companyId };
}

async function bootstrapCompany(name: string) {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  return prisma.company.create({
    data: { name: `${name}'s Company`, trialEndsAt, subscriptionStatus: "trialing" },
  });
}

// bcrypt only uses the first 72 bytes of input, so cap the length explicitly.
const passwordSchema = z.string().min(8).max(72);

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: passwordSchema,
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) throw new ApiError(409, "An account with that email already exists");

    const passwordHash = await bcrypt.hash(password, 10);
    const company = await bootstrapCompany(name);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        companyId: company.id,
        emailVerified: false,
      },
    });
    const token = signToken({ userId: user.id, email: user.email });
    res.status(201).json({ token, user: publicUser(user) });
  })
);

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.passwordHash) throw new ApiError(401, "Invalid email or password");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new ApiError(401, "Invalid email or password");
    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: publicUser(user) });
  })
);

// ---- Magic link ----
const magicRequestSchema = z.object({ email: z.string().email() });

router.post(
  "/magic-link",
  asyncHandler(async (req, res) => {
    const { email } = magicRequestSchema.parse(req.body);
    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      const company = await bootstrapCompany(email.split("@")[0]);
      user = await prisma.user.create({
        data: { name: email.split("@")[0], email: email.toLowerCase(), companyId: company.id },
      });
    }
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.authToken.create({
      data: { userId: user.id, type: "MAGIC_LINK", token: hashToken(rawToken), expiresAt },
    });
    const link = `${env.appUrl}/auth/magic?token=${rawToken}`;
    const { delivered } = await sendMail({
      to: user.email,
      subject: "Your InvoiceFlow login link",
      html: `<p>Click to sign in to InvoiceFlow AI:</p><p><a href="${link}">Sign in</a></p><p>This link expires in 15 minutes.</p>`,
    });
    res.json({ ok: true, delivered, ...(isDev ? { devLink: link } : {}) });
  })
);

const magicVerifySchema = z.object({ token: z.string() });

router.post(
  "/magic-link/verify",
  asyncHandler(async (req, res) => {
    const { token } = magicVerifySchema.parse(req.body);
    const record = await prisma.authToken.findUnique({ where: { token: hashToken(token) }, include: { user: true } });
    if (!record || record.type !== "MAGIC_LINK" || record.usedAt || record.expiresAt < new Date()) {
      throw new ApiError(400, "Invalid or expired link");
    }
    await prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
    const jwtToken = signToken({ userId: record.user.id, email: record.user.email });
    res.json({ token: jwtToken, user: publicUser(record.user) });
  })
);

// ---- Google login ----
const googleSchema = z.object({ credential: z.string() });

router.post(
  "/google",
  asyncHandler(async (req, res) => {
    const { credential } = googleSchema.parse(req.body);
    // Without a configured client ID we cannot verify the token audience, and
    // accepting arbitrary Google-issued tokens would let any third-party app's
    // token sign users in. Refuse instead of verifying loosely.
    if (!env.googleClientId) throw new ApiError(503, "Google login is not configured");
    // Verify the Google ID token via Google's tokeninfo endpoint.
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!resp.ok) throw new ApiError(401, "Invalid Google credential");
    const info = (await resp.json()) as { sub: string; email: string; name?: string; picture?: string; aud?: string };
    if (info.aud !== env.googleClientId) {
      throw new ApiError(401, "Google credential audience mismatch");
    }
    let user = await prisma.user.findFirst({ where: { OR: [{ googleId: info.sub }, { email: info.email.toLowerCase() }] } });
    if (!user) {
      const company = await bootstrapCompany(info.name || info.email.split("@")[0]);
      user = await prisma.user.create({
        data: {
          name: info.name || info.email.split("@")[0],
          email: info.email.toLowerCase(),
          googleId: info.sub,
          avatarUrl: info.picture,
          emailVerified: true,
          companyId: company.id,
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId: info.sub, avatarUrl: info.picture ?? user.avatarUrl } });
    }
    const token = signToken({ userId: user.id, email: user.email });
    res.json({ token, user: publicUser(user) });
  })
);

// ---- Forgot / reset password ----
const forgotSchema = z.object({ email: z.string().email() });

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = forgotSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always respond ok to avoid account enumeration.
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.authToken.create({ data: { userId: user.id, type: "PASSWORD_RESET", token: hashToken(rawToken), expiresAt } });
      const link = `${env.appUrl}/auth/reset?token=${rawToken}`;
      await sendMail({
        to: user.email,
        subject: "Reset your InvoiceFlow password",
        html: `<p>Reset your password:</p><p><a href="${link}">Choose a new password</a></p><p>This link expires in 1 hour.</p>`,
      });
      if (isDev) return res.json({ ok: true, devLink: link });
    }
    res.json({ ok: true });
  })
);

const resetSchema = z.object({ token: z.string(), password: passwordSchema });

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, password } = resetSchema.parse(req.body);
    const record = await prisma.authToken.findUnique({ where: { token: hashToken(token) }, include: { user: true } });
    if (!record || record.type !== "PASSWORD_RESET" || record.usedAt || record.expiresAt < new Date()) {
      throw new ApiError(400, "Invalid or expired reset link");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    const jwtToken = signToken({ userId: record.user.id, email: record.user.email });
    res.json({ token: jwtToken, user: publicUser(record.user) });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { company: true } });
    if (!user) throw new ApiError(404, "User not found");
    res.json({ user: publicUser(user), company: user.company });
  })
);

export default router;
