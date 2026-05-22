import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS, formatReminderMessage } from "@/lib/sms";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");

  const where = status ? { status: status as "PENDING" | "SENT" | "FAILED" | "CANCELLED" } : {};

  const reminders = await prisma.reminder.findMany({
    where,
    include: {
      appointment: {
        include: { patient: true },
      },
    },
    orderBy: { scheduledFor: "asc" },
    take: 50,
  });

  return NextResponse.json({ reminders });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "process") {
    const now = new Date();
    const pendingReminders = await prisma.reminder.findMany({
      where: {
        status: "PENDING",
        scheduledFor: { lte: now },
      },
      include: {
        appointment: {
          include: { patient: true },
        },
      },
    });

    const template = await prisma.messageTemplate.findUnique({
      where: { name: "appointment_reminder" },
    });

    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
    });

    let sent = 0;
    let failed = 0;

    for (const reminder of pendingReminders) {
      const { appointment } = reminder;
      const { patient } = appointment;

      const content = template
        ? formatReminderMessage(template.content, {
            patient_name: patient.name,
            facility: settings?.facilityName || "Health Facility",
            date: new Date(appointment.appointmentDate).toLocaleDateString(),
            time: new Date(appointment.appointmentDate).toLocaleTimeString(
              [],
              { hour: "2-digit", minute: "2-digit" }
            ),
          })
        : `Reminder: You have an appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()}`;

      const result = await sendSMS(patient.phoneNumber, content);

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: result.success ? "SENT" : "FAILED",
          sentAt: result.success ? now : null,
        },
      });

      await prisma.message.create({
        data: {
          patientId: patient.id,
          appointmentId: appointment.id,
          content,
          status: result.success ? "SENT" : "FAILED",
          sentAt: result.success ? now : null,
          providerRef: result.messageId || null,
        },
      });

      if (result.success) sent++;
      else failed++;
    }

    return NextResponse.json({
      processed: pendingReminders.length,
      sent,
      failed,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
