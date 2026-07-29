import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { buildReminderMessageByType } from "@/lib/sms";

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireAuth(["ADMIN", "RECEPTIONIST", "NURSE", "DOCTOR"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  // Auto-update any Scheduled appointments whose date has already passed to Missed.
  const overdue = await prisma.appointment.findMany({
    where: { status: "SCHEDULED", appointmentDate: { lt: new Date() } },
    select: { id: true },
  });
  if (overdue.length > 0) {
    const overdueIds = overdue.map((a) => a.id);
    await prisma.appointment.updateMany({
      where: { id: { in: overdueIds } },
      data: { status: "MISSED" },
    });
    await prisma.scheduledReminder.updateMany({
      where: { appointmentId: { in: overdueIds }, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  }
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const date = searchParams.get("date") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { patient: { fullName: { contains: search } } },
      { doctorName: { contains: search } },
    ];
  }
  // Doctors only see appointments assigned to their own account.
  if (session.role === "DOCTOR") {
    where.doctorId = session.userId;
  }
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.appointmentDate = { gte: d, lt: next };
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { appointmentDate: "asc" },
      include: {
        patient: { select: { id: true, fullName: true, phoneNumber: true } },
        doctor: { select: { id: true, name: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return NextResponse.json({ appointments, total, page, limit });
}

export async function POST(req: NextRequest) {
  try {
  try {
    const body = await req.json();
    const { patientId, doctorName, doctorId, appointmentDate, notes } = body;

    if (!patientId || !doctorName || !appointmentDate) {
      return NextResponse.json({ error: "patientId, doctorName, and appointmentDate are required." }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: parseInt(patientId),
        doctorName: doctorName.trim(),
        doctorId: doctorId ? parseInt(doctorId) : null,
        appointmentDate: new Date(appointmentDate),
        notes: notes?.trim() ?? null,
        status: "SCHEDULED",
      },
      include: { patient: true },
    });

    // Auto-schedule a reminder for 1 day before the appointment, same time.
    const reminderTime = new Date(appointment.appointmentDate);
    reminderTime.setDate(reminderTime.getDate() - 1);

    if (reminderTime > new Date()) {
      const message = buildReminderMessageByType({
        reminderType: "APPOINTMENT_REMINDER",
        patientName: appointment.patient.fullName,
        appointmentDate: appointment.appointmentDate,
      });

      await prisma.scheduledReminder.create({
        data: {
          patientId: appointment.patientId,
          patientName: appointment.patient.fullName,
          phoneNumber: appointment.patient.phoneNumber,
          reminderType: "APPOINTMENT_REMINDER",
          message,
          status: "PENDING",
          scheduledAt: reminderTime,
          appointmentId: appointment.id,
        },
      });
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
