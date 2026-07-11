import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Prisma throws P2025 ("An operation failed because it depends on one or more
// records that were required but not found") when an update/delete targets a
// missing row. Use this to distinguish a genuine 404 from a real server error
// instead of masking every failure as "Not found".
export function isRecordNotFoundError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025"
  );
}
