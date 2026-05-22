import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  appointmentDate: z.string().min(1),
  type: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where = status ? { status: status as "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" } : {};

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: { patient: true },
      orderBy: { appointmentDate: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appointment.count({ where }),
  ]);

  return NextResponse.json({ appointments, total, page, limit });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createAppointmentSchema.parse(body);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        appointmentDate: new Date(data.appointmentDate),
        type: data.type || null,
        notes: data.notes || null,
      },
      include: { patient: true },
    });

    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" },
    });

    if (settings?.reminderEnabled) {
      const reminderDate = new Date(data.appointmentDate);
      reminderDate.setHours(
        reminderDate.getHours() - (settings.reminderHoursBefore || 24)
      );

      if (reminderDate > new Date()) {
        await prisma.reminder.create({
          data: {
            appointmentId: appointment.id,
            scheduledFor: reminderDate,
          },
        });
      }
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
