import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";

export async function POST(_req: NextRequest) {
  console.log("[SMS ENDPOINT] endpoint called:", "POST /api/sms/scheduled/send-due");

  try {
    const session = await requireAuth(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"]);
    console.log("[SMS SEND DUE] current user:", {
      userId: session.userId,
      username: session.username,
      role: session.role,
      name: session.name,
    });
    console.log("[SMS SEND DUE] detected role:", session.role);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg === "Unauthorized" ? 401 : 403;
    console.error("[SMS SEND DUE] auth failed", {
      route: "POST /api/sms/scheduled/send-due",
      error: msg,
    });
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
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

    const results: Array<{
      id: number;
      phoneNumber: string;
      status: string;
      error?: string;
    }> = [];

    for (const item of due) {
      try {
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

        results.push({
          id: item.id,
          phoneNumber: item.phoneNumber,
          status: updated.status,
          ...(smsResult.error ? { error: smsResult.error } : {}),
        });
      } catch (err) {
        // Don't let one failing reminder abort the whole batch; record it and
        // continue so the remaining due reminders are still processed.
        console.error("[SMS SEND DUE] failed to process reminder", {
          id: item.id,
          error: err,
        });
        results.push({
          id: item.id,
          phoneNumber: item.phoneNumber,
          status: "FAILED",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const failed = results.filter((r) => r.status === "FAILED").length;
    return NextResponse.json(
      { processed: results.length, failed, results },
      { status: 200 }
    );
  } catch (err) {
    console.error("[SMS SEND DUE] failed", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

