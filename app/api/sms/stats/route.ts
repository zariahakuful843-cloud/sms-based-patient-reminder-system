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

  // KPI totals from shared service
  const stats = await getSmsStats(from && to ? { from, to } : undefined);

  // Keep backward compatibility with older clients: map pending -> pendingMessages.
  const pending = stats.pendingMessages;


  // Reminder type distribution (SMS analytics): GROUP BY reminderType
  const reminderTypeRows = await prisma.sMSLog.groupBy({
    by: ["reminderType"],
    where: dateWhere,
    _count: { _all: true },
    orderBy: { reminderType: "asc" },
  });

  // Monthly trends: GROUP BY sentAt month
  // (If Prisma version doesn’t support date truncation directly, this uses raw SQL.)
  const monthlyTrends = await prisma.$queryRaw<
    Array<{ month: string; sent: bigint; delivered: bigint }>
  >`
    SELECT
      to_char(date_trunc('month', "sentAt"), 'Mon YYYY') AS month,
      COUNT(*) FILTER (WHERE "status" = 'SENT')::bigint AS sent,
      COUNT(*) FILTER (WHERE "status" = 'SENT')::bigint AS delivered
    FROM "SMSLog"
    ${from && to ? prisma.$queryRaw`WHERE "sentAt" BETWEEN ${from} AND ${to}` : prisma.$queryRaw``}
    GROUP BY date_trunc('month', "sentAt")
    ORDER BY date_trunc('month', "sentAt") DESC
    LIMIT 6;
  `;

  // Reverse so UI shows oldest -> newest
  const monthlyTrendsReversed = [...monthlyTrends].reverse().map((t) => ({
    month: t.month,
    sent: Number(t.sent),
    delivered: Number(t.delivered),
  }));

  return NextResponse.json({
    ...stats,
    // Backward compatible alias used by the current Reports page.
    pending,
    reminderTypes: reminderTypeRows.map((r) => ({
      name: r.reminderType,
      value: r._count._all,
    })),
    monthlyTrends: monthlyTrendsReversed,
  });
}


