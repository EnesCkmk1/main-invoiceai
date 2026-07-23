import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/http.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string; companyId: string | null };
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies?.token) return req.cookies.token as string;
  return null;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw new ApiError(401, "Authentication required");
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new ApiError(401, "Invalid session");
    req.user = { id: user.id, email: user.email, companyId: user.companyId };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(new ApiError(401, "Invalid or expired token"));
  }
}

/** Ensures the authenticated user has a company (required for most resources). */
export function requireCompany(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.companyId) return next(new ApiError(400, "No company associated with account"));
  next();
}
