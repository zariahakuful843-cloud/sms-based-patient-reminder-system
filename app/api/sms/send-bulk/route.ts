import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { buildReminderMessageByType, sendSMS, type ReminderType } from "@/lib/sms";

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

  try {
    const session = await requireAuth(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"]);
    console.log("[SMS SEND BULK] current user:", {
      userId: session.userId,
      username: session.username,
      role: session.role,
      name: session.name,
    });
    console.log("[SMS SEND BULK] detected role:", session.role);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg === "Unauthorized" ? 401 : 403;
    console.error("[SMS SEND BULK] auth failed", {
      route: "POST /api/sms/send-bulk",
      error: msg,
    });
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }


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
      return NextResponse.json({ error: "reminderType and recipients are required." }, { status: 400 });
    }

    // Send sequentially to keep Arkesel load manageable; can be optimized later.
    const results: Array<{ recipient: Recipient; smsResult: unknown; logId?: number }> = [];

    for (const r of recipients) {
      if (!r.phoneNumber || !r.patientName) continue;

      const message = buildReminderMessageByType({
        reminderType,
        patientName: r.patientName.split(" ")[0],
        appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined,
        vaccinationDate: vaccinationDate ? new Date(vaccinationDate) : undefined,
        antenatalDate: antenatalDate ? new Date(antenatalDate) : undefined,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        laboratoryTestDate: laboratoryTestDate ? new Date(laboratoryTestDate) : undefined,
        medicationName,
      });

      // If patientId missing, we still store a log by creating a temporary linkage is not possible.
      // For now require patientId for persistence.
      if (!r.patientId) {
        results.push({ recipient: r, smsResult: { success: false, error: "patientId is required for persistence." } });
        continue;
      }

      const pending = await prisma.sMSLog.create({
        data: {
          patientId: r.patientId,
          patientName: r.patientName,
          phoneNumber: r.phoneNumber,
          reminderType,
          message,
          status: "PENDING",
        },
      });

      const smsResult = await sendSMS({ to: r.phoneNumber, message });

      const updated = await prisma.sMSLog.update({
        where: { id: pending.id },
        data: {
          status: smsResult.status === "FAILED" ? "FAILED" : "SENT",
        },
      });

      results.push({ recipient: r, smsResult, logId: updated.id });
    }

    return NextResponse.json({ results }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

