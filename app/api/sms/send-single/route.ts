import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, authErrorStatus } from "@/lib/auth";
import { canSendReminderType } from "@/lib/rbac";
import { buildReminderMessageByType, sendSMS, type ReminderType } from "@/lib/sms";

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
  let session;
  try {
    session = await requireAuth();
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

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
      return NextResponse.json({ error: "patientId and reminderType are required." }, { status: 400 });
    }

    if (!canSendReminderType(session.role, reminderType)) {
      return NextResponse.json(
        { error: `Your role is not permitted to send ${reminderType} reminders.` },
        { status: 403 }
      );
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return NextResponse.json({ error: "Patient not found." }, { status: 404 });

    const message = buildReminderMessageByType({
      reminderType,
      patientName: patient.fullName.split(" ")[0],
      appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined,
      vaccinationDate: vaccinationDate ? new Date(vaccinationDate) : undefined,
      antenatalDate: antenatalDate ? new Date(antenatalDate) : undefined,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      laboratoryTestDate: laboratoryTestDate ? new Date(laboratoryTestDate) : undefined,
      medicationName,
    });

    const to = phoneNumber ?? patient.phoneNumber;

    const pending = await prisma.sMSLog.create({
      data: {
        patientId,
        patientName: patient.fullName,
        phoneNumber: to,
        reminderType,
        message,
        status: "PENDING",
      },
    });

    const result = await sendSMS({ to, message, senderId: undefined });

    if (result.status === "FAILED") {
      console.warn("[SMS SEND SINGLE] Failed to send SMS to", to, "Error:", result.error);
    }

    const log = await prisma.sMSLog.update({
      where: { id: pending.id },
      data: {
        status: result.status === "FAILED" ? "FAILED" : "SENT",
      },
    });

    return NextResponse.json({ ...log, smsResult: result }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

