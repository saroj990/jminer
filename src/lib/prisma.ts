import path from "path";
import { PrismaClient } from "@prisma/client";

// SQLite paths are ambiguous between Prisma CLI (schema dir) and Next.js (cwd).
// Always resolve to <project>/prisma/dev.db unless an absolute file: URL is set.
function resolveDatabaseUrl() {
  const raw = process.env.DATABASE_URL?.trim();
  if (raw && raw.startsWith("file:") && path.isAbsolute(raw.slice(5))) {
    return raw;
  }
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  return `file:${dbPath}`;
}

process.env.DATABASE_URL = resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
