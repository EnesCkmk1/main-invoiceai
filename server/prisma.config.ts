import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` must work without a live database (CI / Vercel build).
// Runtime and migrate still require a real DATABASE_URL.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
