import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api/guard";
import { jsonError } from "@/lib/api/response";
import { sendSMS } from "@/lib/sms";
import { resolveLogStatus } from "@/lib/sms-log";

const STAFF_ROLES = ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"];

export async function POST(req: NextRequest) {
  const auth = await guard(STAFF_ROLES, { label: "SMS SEND" });
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { patientId, message, reminderType, phoneNumber } = body as {
      patientId: number;
      message: string;
      reminderType?: string;
      phoneNumber?: string;
    };

    if (!patientId || !message) {
      return jsonError("patientId and message are required.", 400);
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return jsonError("Patient not found.", 404);

    const to = phoneNumber ?? patient.phoneNumber;
    const result = await sendSMS({ to, message });

    const log = await prisma.sMSLog.create({
      data: {
        patientId,
        patientName: patient.fullName,
        phoneNumber: to,
        reminderType: reminderType ?? "APPOINTMENT_REMINDER",
        message,
        status: resolveLogStatus(result),
      },
    });

    return NextResponse.json({ ...log, smsResult: result }, { status: 201 });
  } catch {
    return jsonError("Server error.", 500);
  }
}
