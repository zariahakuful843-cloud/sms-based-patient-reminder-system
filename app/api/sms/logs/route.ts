import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api/guard";
import { getPagination } from "@/lib/api/pagination";

export async function GET(req: NextRequest) {
  const auth = await guard();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const { page, limit, skip } = getPagination(searchParams);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { patient: { fullName: { contains: search } } },
      { phoneNumber: { contains: search } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.sMSLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { sentAt: "desc" },
      include: { patient: { select: { id: true, fullName: true } } },
    }),
    prisma.sMSLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}
