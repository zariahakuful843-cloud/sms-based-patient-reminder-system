import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api/guard";
import { jsonError } from "@/lib/api/response";
import { sendSMS, type SMSResult } from "@/lib/sms";
import { resolveLogStatus } from "@/lib/sms-log";

const STAFF_ROLES = ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"];

export async function POST(_req: NextRequest) {
  console.log("[SMS ENDPOINT] endpoint called:", "POST /api/sms/scheduled/send-due");
  const auth = await guard(STAFF_ROLES, { label: "SMS SEND DUE" });
  if (auth.response) return auth.response;

  try {
    const due = await prisma.scheduledReminder.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: new Date() },
      },
      take: 200,
      orderBy: { scheduledAt: "asc" },
    });

    const results: Array<{ id: number; phoneNumber: string; status: string }> = [];

    for (const item of due) {
      const smsResult: SMSResult = await sendSMS({ to: item.phoneNumber, message: item.message });
      const status = resolveLogStatus(smsResult);

      await prisma.scheduledReminder.update({
        where: { id: item.id },
        data: { status, sentAt: new Date() },
      });

      await prisma.sMSLog.create({
        data: {
          patientId: item.patientId,
          patientName: item.patientName,
          phoneNumber: item.phoneNumber,
          reminderType: item.reminderType,
          message: item.message,
          status,
        },
      });

      results.push({ id: item.id, phoneNumber: item.phoneNumber, status });
    }

    return NextResponse.json({ processed: results.length, results }, { status: 200 });
  } catch {
    return jsonError("Server error.", 500);
  }
}
