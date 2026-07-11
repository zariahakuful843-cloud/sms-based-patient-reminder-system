import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { jsonError } from "@/lib/api/response";
import { sendSMS } from "@/lib/sms";
import { sendAndLogSMS } from "@/lib/sms-log";

const STAFF_ROLES = ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"];

export async function POST(req: NextRequest) {
  console.log("[SMS ENDPOINT] endpoint called:", "POST /api/sms/test");
  const auth = await guard(STAFF_ROLES, { label: "SMS TEST" });
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { phoneNumber, patientId, patientName } = body as {
      phoneNumber: string;
      patientId?: number;
      patientName?: string;
    };

    if (!phoneNumber) return jsonError("phoneNumber is required.", 400);

    const message = `SMS Reminder test: Your system is working. Reply STOP to opt out.`;

    // If patientId provided, store as a log; otherwise just simulate sending.
    if (patientId && patientName) {
      const { log, smsResult } = await sendAndLogSMS({
        patientId,
        patientName,
        phoneNumber,
        reminderType: "APPOINTMENT_REMINDER",
        message,
      });

      return NextResponse.json({ ...log, smsResult }, { status: 201 });
    }

    const smsResult = await sendSMS({ to: phoneNumber, message });
    return NextResponse.json({ smsResult }, { status: 201 });
  } catch {
    return jsonError("Server error.", 500);
  }
}
