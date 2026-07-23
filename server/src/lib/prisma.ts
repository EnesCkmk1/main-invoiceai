import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.js";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  // Prisma 7 is Rust-free and requires an explicit driver adapter.
  // Match the v6 connection-pool behavior with an explicit connection timeout.
  const adapter = new PrismaPg({
    connectionString: env.databaseUrl,
    connectionTimeoutMillis: 5000,
  });
  return new PrismaClient({
    adapter,
    log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (env.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}
