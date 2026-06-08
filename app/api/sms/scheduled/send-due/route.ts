import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";

export async function POST(_req: NextRequest) {
  try {
    await requireAuth(["ADMIN", "RECEPTIONIST"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
      const smsResult = await sendSMS({ to: item.phoneNumber, message: item.message });

      const updated = await prisma.scheduledReminder.update({
        where: { id: item.id },
        data: {
          status: smsResult.status === "FAILED" ? "FAILED" : "SENT",
          sentAt: new Date(),
        },
      });

      await prisma.sMSLog.create({
        data: {
          patientId: item.patientId,
          patientName: item.patientName,
          phoneNumber: item.phoneNumber,
          reminderType: item.reminderType,
          message: item.message,
          status: updated.status,
        },
      });

      results.push({ id: item.id, phoneNumber: item.phoneNumber, status: updated.status });
    }

    return NextResponse.json({ processed: results.length, results }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

