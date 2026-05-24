import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  // Convert relative file path to absolute so it works from any cwd
  const absoluteUrl = url.startsWith("file:")
    ? `file:${path.resolve(process.cwd(), url.replace(/^file:/, ""))}`
    : url;

  const adapter = new PrismaBetterSqlite3({ url: absoluteUrl });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
