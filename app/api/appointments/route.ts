import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      include: { patient: { select: { id: true, fullName: true, phoneNumber: true } } },
    }),
    prisma.appointment.count({ where }),
  ]);

  return NextResponse.json({ appointments, total, page, limit });
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["ADMIN", "RECEPTIONIST"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { patientId, doctorName, appointmentDate, notes } = body;

    if (!patientId || !doctorName || !appointmentDate) {
      return NextResponse.json({ error: "patientId, doctorName, and appointmentDate are required." }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: parseInt(patientId),
        doctorName: doctorName.trim(),
        appointmentDate: new Date(appointmentDate),
        notes: notes?.trim() ?? null,
        status: "SCHEDULED",
      },
      include: { patient: true },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (err) {
    console.error("[APPOINTMENTS] create failed", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
