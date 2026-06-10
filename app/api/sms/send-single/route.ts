import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
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
  try {
    await requireAuth(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"]);
  } catch (err) {
    console.error("[SMS SEND SINGLE] forbidden", {
      route: "POST /api/sms/send-single",
      error: err instanceof Error ? err.message : err,
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

