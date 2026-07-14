import { prisma } from "@/lib/prisma";

export type SmsStats = {
  total: number;
  sent: number;
  delivered: number;
  pendingReminders: number;
  pendingMessages: number;
  failed: number;
};

export type SmsByReminderType = {
  name: string;
  value: number;
};

export type SmsMonthlyTrend = {
  month: string;
  sent: number;
  delivered: number;
};

/**
 * Single source of truth for SMS statistics.
 *
 * Required business definitions:
 * - Dashboard pending reminders are ScheduledReminder.status = "PENDING"
 * - Reports pending messages are SMSLog.status = "PENDING"
 *
 * SMS analytics totals come from SMSLog.
 * - Delivered is treated as Sent until delivery receipts are implemented.
 */
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(d: Date, months: number) {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function formatMonYYYY(d: Date) {
  return d.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function getMonthlyTrends(params?: { from?: Date; to?: Date }) {
  const { from, to } = params ?? {};

  // Default to last 6 months (inclusive) when from/to not supplied.
  const now = new Date();

  let windowFrom: Date;
  let windowTo: Date;

  if (from && to) {
    windowFrom = startOfMonth(from);
    windowTo = endOfMonth(to);
  } else {
    windowTo = endOfMonth(now);
    windowFrom = startOfMonth(addMonths(windowTo, -5));
  }

  // Always exactly 6 month buckets, oldest -> newest.
  const buckets: Array<{ monthStart: Date; monthLabel: string }> = [];
  let cursor = startOfMonth(windowFrom);
  for (let i = 0; i < 6; i++) {
    buckets.push({ monthStart: cursor, monthLabel: formatMonYYYY(cursor) });
    cursor = addMonths(cursor, 1);
  }

  const counts = await Promise.all(
    buckets.map((b) =>
      prisma.sMSLog.count({
        where: {
          status: "SENT",
          sentAt: {
            gte: b.monthStart,
            lte: endOfMonth(b.monthStart),
          },
        },
      })
    )
  );

  return buckets.map((b, idx) => {
    const sent = counts[idx];
    return {
      month: b.monthLabel,
      sent,
      delivered: sent,
    };
  });
}

export async function getSmsStats(
  params?: { from?: Date; to?: Date }
): Promise<SmsStats & { monthlyTrends: SmsMonthlyTrend[] }> {
  const { from, to } = params ?? {};

  const dateWhere = from && to ? { gte: from, lte: to } : undefined;

  const [total, sent, failed, pendingReminders, pendingMessages] =
    await Promise.all([
      prisma.sMSLog.count({
        where: dateWhere ? { sentAt: dateWhere } : undefined,
      }),
      prisma.sMSLog.count({
        where: {
          status: "SENT",
          ...(dateWhere ? { sentAt: dateWhere } : {}),
        },
      }),
      prisma.sMSLog.count({
        where: {
          status: "FAILED",
          ...(dateWhere ? { sentAt: dateWhere } : {}),
        },
      }),
      prisma.scheduledReminder.count({
        where: {
          status: "PENDING",
          ...(dateWhere ? { createdAt: dateWhere } : {}),
        },
      }),
      prisma.sMSLog.count({
        where: {
          status: "PENDING",
          ...(dateWhere ? { sentAt: dateWhere } : {}),
        },
      }),
    ]);

  const delivered = sent; // project rule
  const monthlyTrends = await getMonthlyTrends({ from, to });

  return {
    total,
    sent,
    delivered,
    pendingReminders,
    pendingMessages,
    failed,
    monthlyTrends,
  };
}




