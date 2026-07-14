import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getSmsStats } from "@/lib/smsStats";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? new Date(toParam) : undefined;
  if (to) to.setHours(23, 59, 59, 999);

  const dateWhere =
    from && to ? { sentAt: { gte: from, lte: to } as const } : undefined;

  // KPI totals + monthly trends from shared service (single source of truth)
  const stats = await getSmsStats(from && to ? { from, to } : undefined);

  // Backward compatibility alias used by the current Reports page.
  const pending = stats.pendingMessages;

  // Reminder type distribution (SMS analytics): GROUP BY reminderType
  const reminderTypeRows = await prisma.sMSLog.groupBy({
    by: ["reminderType"],
    where: dateWhere,
    _count: { _all: true },
    orderBy: { reminderType: "asc" },
  });

  return NextResponse.json({
    ...stats,
    pending,
    reminderTypes: reminderTypeRows.map((r) => ({
      name: r.reminderType,
      value: r._count._all,
    })),
  });
}




