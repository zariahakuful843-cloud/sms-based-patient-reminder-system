import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api/guard";
import { jsonError } from "@/lib/api/response";
import { buildReminderMessage, type ReminderType } from "@/lib/sms";
import { sendAndLogSMS } from "@/lib/sms-log";

const STAFF_ROLES = ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"];

type Body = {
  patientId: number;
  phoneNumber?: string;
  reminderType: ReminderType;
  patientName?: string;
  appointmentDate?: string;
  vaccinationDate?: string;
  antenatalDate?: string;
  followUpDate?: string;
  laboratoryTestDate?: string;
  medicationName?: string;
};

export async function POST(req: NextRequest) {
  console.log("[SMS ENDPOINT] endpoint called:", "POST /api/sms/send-single");
  const auth = await guard(STAFF_ROLES, { label: "SMS SEND SINGLE" });
  if (auth.response) return auth.response;

  try {
    const body = (await req.json()) as Body;
    const {
      patientId,
      phoneNumber,
      reminderType,
      medicationName,
      appointmentDate,
      vaccinationDate,
      antenatalDate,
      followUpDate,
      laboratoryTestDate,
    } = body;

    if (!patientId || !reminderType) {
      return jsonError("patientId and reminderType are required.", 400);
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return jsonError("Patient not found.", 404);

    const message = buildReminderMessage({
      reminderType,
      patientName: patient.fullName,
      medicationName,
      appointmentDate,
      vaccinationDate,
      antenatalDate,
      followUpDate,
      laboratoryTestDate,
    });

    const to = phoneNumber ?? patient.phoneNumber;

    const { log, smsResult } = await sendAndLogSMS({
      patientId,
      patientName: patient.fullName,
      phoneNumber: to,
      reminderType,
      message,
    });

    if (smsResult.status === "FAILED") {
      console.warn("[SMS SEND SINGLE] Failed to send SMS to", to, "Error:", smsResult.error);
    }

    return NextResponse.json({ ...log, smsResult }, { status: 201 });
  } catch {
    return jsonError("Server error.", 500);
  }
}
