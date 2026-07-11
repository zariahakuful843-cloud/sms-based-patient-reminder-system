import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { jsonError } from "@/lib/api/response";
import { buildReminderMessage, type ReminderType } from "@/lib/sms";
import { sendAndLogSMS } from "@/lib/sms-log";

const STAFF_ROLES = ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"];

type Recipient = {
  phoneNumber: string;
  patientName: string;
  patientId?: number;
};

type Body = {
  reminderType: ReminderType;
  recipients: Recipient[];
  medicationName?: string;
  appointmentDate?: string;
  vaccinationDate?: string;
  antenatalDate?: string;
  followUpDate?: string;
  laboratoryTestDate?: string;
};

export async function POST(req: NextRequest) {
  console.log("[SMS ENDPOINT] endpoint called:", "POST /api/sms/send-bulk");
  const auth = await guard(STAFF_ROLES, { label: "SMS SEND BULK" });
  if (auth.response) return auth.response;

  try {
    const body = (await req.json()) as Body;
    const {
      reminderType,
      recipients,
      medicationName,
      appointmentDate,
      vaccinationDate,
      antenatalDate,
      followUpDate,
      laboratoryTestDate,
    } = body;

    if (!reminderType || !Array.isArray(recipients) || recipients.length === 0) {
      return jsonError("reminderType and recipients are required.", 400);
    }

    // Send sequentially to keep Arkesel load manageable; can be optimized later.
    const results: Array<{ recipient: Recipient; smsResult: unknown; logId?: number }> = [];

    for (const r of recipients) {
      if (!r.phoneNumber || !r.patientName) continue;

      const message = buildReminderMessage({
        reminderType,
        patientName: r.patientName,
        medicationName,
        appointmentDate,
        vaccinationDate,
        antenatalDate,
        followUpDate,
        laboratoryTestDate,
      });

      // If patientId missing, we still store a log by creating a temporary linkage is not possible.
      // For now require patientId for persistence.
      if (!r.patientId) {
        results.push({ recipient: r, smsResult: { success: false, error: "patientId is required for persistence." } });
        continue;
      }

      const { log, smsResult } = await sendAndLogSMS({
        patientId: r.patientId,
        patientName: r.patientName,
        phoneNumber: r.phoneNumber,
        reminderType,
        message,
      });

      results.push({ recipient: r, smsResult, logId: log.id });
    }

    return NextResponse.json({ results }, { status: 201 });
  } catch {
    return jsonError("Server error.", 500);
  }
}
