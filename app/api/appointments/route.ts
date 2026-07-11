import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, authErrorStatus } from "@/lib/auth";
import { appointmentScopeWhere } from "@/lib/scope";

const APPT_INCLUDE = {
  patient: { select: { id: true, fullName: true, phoneNumber: true } },
  department: { select: { id: true, name: true, code: true } },
  doctor: { select: { id: true, name: true } },
} as const;

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requirePermission("appointments.read");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const date = searchParams.get("date") ?? "";
  const departmentId = searchParams.get("departmentId") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  // Role-based visibility scope (nurse/doctor limited to their department).
  const where: Record<string, unknown> = { ...appointmentScopeWhere(session) };
  if (status) where.status = status;
  if (departmentId) where.departmentId = parseInt(departmentId, 10);
  if (search) {
    where.OR = [
      { patient: { fullName: { contains: search, mode: "insensitive" } } },
      { doctorName: { contains: search, mode: "insensitive" } },
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
      include: APPT_INCLUDE,
    }),
    prisma.appointment.count({ where }),
  ]);

  return NextResponse.json({ appointments, total, page, limit });
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("appointments.manage");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  try {
    const body = await req.json();
    const { patientId, departmentId, doctorId, appointmentDate, appointmentType, notes } = body;

    if (!patientId || !departmentId || !appointmentDate) {
      return NextResponse.json(
        { error: "patientId, departmentId, and appointmentDate are required." },
        { status: 400 }
      );
    }

    const department = await prisma.department.findUnique({
      where: { id: parseInt(departmentId, 10) },
    });
    if (!department || !department.active) {
      return NextResponse.json({ error: "Invalid or inactive department." }, { status: 400 });
    }

    // A doctor is optional; if given they must belong to the chosen department.
    let doctorName: string | null = null;
    let resolvedDoctorId: number | null = null;
    if (doctorId) {
      const doctor = await prisma.user.findFirst({
        where: { id: parseInt(doctorId, 10), role: "DOCTOR", departmentId: department.id },
      });
      if (!doctor) {
        return NextResponse.json(
          { error: "Selected doctor is not in the chosen department." },
          { status: 400 }
        );
      }
      resolvedDoctorId = doctor.id;
      doctorName = doctor.name;
    }

    // Simple per-department daily queue number.
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const sameDayCount = await prisma.appointment.count({
      where: { departmentId: department.id, appointmentDate: { gte: startOfDay, lt: endOfDay } },
    });

    const appointment = await prisma.appointment.create({
      data: {
        patientId: parseInt(patientId, 10),
        departmentId: department.id,
        doctorId: resolvedDoctorId,
        doctorName,
        appointmentDate: new Date(appointmentDate),
        appointmentType: appointmentType ? String(appointmentType).trim() : null,
        notes: notes ? String(notes).trim() : null,
        status: "SCHEDULED",
        queueStatus: "WAITING",
        queueNumber: sameDayCount + 1,
      },
      include: APPT_INCLUDE,
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
