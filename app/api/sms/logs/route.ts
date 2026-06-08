import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

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

