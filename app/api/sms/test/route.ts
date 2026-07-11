import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  console.log("[SMS ENDPOINT] endpoint called:", "POST /api/sms/test");

  try {
    const session = await requireAuth(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"]);
    console.log("[SMS TEST] current user:", {
      userId: session.userId,
      username: session.username,
      role: session.role,
      name: session.name,
    });
    console.log("[SMS TEST] detected role:", session.role);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg === "Unauthorized" ? 401 : 403;
    console.error("[SMS TEST] auth failed", {
      route: "POST /api/sms/test",
      error: msg,
    });
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }


  try {
    const body = await req.json();
    const { phoneNumber, patientId, patientName } = body as {
      phoneNumber: string;
      patientId?: number;
      patientName?: string;
    };

    if (!phoneNumber) return NextResponse.json({ error: "phoneNumber is required." }, { status: 400 });

    const message = `SMS Reminder test: Your system is working. Reply STOP to opt out.`;

    // If patientId provided, store as a log; otherwise just simulate sending.
    if (patientId && patientName) {
      const pending = await prisma.sMSLog.create({
        data: {
          patientId,
          patientName,
          phoneNumber,
          reminderType: "APPOINTMENT_REMINDER",
          message,
          status: "PENDING",
        },
      });

      const smsResult = await sendSMS({ to: phoneNumber, message });

      const updated = await prisma.sMSLog.update({
        where: { id: pending.id },
        data: {
          status: smsResult.status === "FAILED" ? "FAILED" : "SENT",
        },
      });

      return NextResponse.json({ ...updated, smsResult }, { status: 201 });
    }

    const smsResult = await sendSMS({ to: phoneNumber, message });
    return NextResponse.json({ smsResult }, { status: 201 });
  } catch (err) {
    console.error("[SMS TEST] failed", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

