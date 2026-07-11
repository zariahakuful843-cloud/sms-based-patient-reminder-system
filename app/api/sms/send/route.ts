import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, authErrorStatus } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    await requirePermission("sms.manage");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  try {
    const body = await req.json();
    const { patientId, message, reminderType, phoneNumber } = body as {
      patientId: number;
      message: string;
      reminderType?: string;
      phoneNumber?: string;
    };

    if (!patientId || !message) {
      return NextResponse.json({ error: "patientId and message are required." }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return NextResponse.json({ error: "Patient not found." }, { status: 404 });

    const to = phoneNumber ?? patient.phoneNumber;
    const result = await sendSMS({ to, message });

    const log = await prisma.sMSLog.create({
      data: {
        patientId,
        patientName: patient.fullName,
        phoneNumber: to,
        reminderType: reminderType ?? "APPOINTMENT_REMINDER",
        message,
        status: result.status === "FAILED" ? "FAILED" : "SENT",
      },
    });

    return NextResponse.json({ ...log, smsResult: result }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

