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
export async function getSmsStats(
  params?: { from?: Date; to?: Date }
): Promise<SmsStats> {
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
          // If a time window is applied, treat ScheduledReminder createdAt as the window.
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

  return {
    total,
    sent,
    delivered,
    pendingReminders,
    pendingMessages,
    failed,
  };
}

