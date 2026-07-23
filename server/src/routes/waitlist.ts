import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";

const router = Router();

const waitlistSchema = z.object({
  email: z.string().email().max(320),
  source: z.string().max(100).optional(),
});

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { email, source } = waitlistSchema.parse(req.body);
    const normalized = email.trim().toLowerCase();

    const existing = await prisma.waitlistEntry.findUnique({ where: { email: normalized } });
    if (existing) {
      return res.json({ ok: true, alreadyRegistered: true });
    }

    await prisma.waitlistEntry.create({
      data: { email: normalized, source: source ?? "landing" },
    });

    res.status(201).json({ ok: true, alreadyRegistered: false });
  })
);

export default router;
