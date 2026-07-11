import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, authErrorStatus } from "@/lib/auth";
import { isDepartmentScoped } from "@/lib/rbac";

const APPT_INCLUDE = {
  patient: { select: { id: true, fullName: true, phoneNumber: true } },
  department: { select: { id: true, name: true, code: true } },
  doctor: { select: { id: true, name: true } },
} as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requirePermission("appointments.read");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }
  const { id } = await params;
  const appt = await prisma.appointment.findUnique({
    where: { id: parseInt(id) },
    include: APPT_INCLUDE,
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Nurses and doctors can only view appointments in their own department.
  if (isDepartmentScoped(session.role) && session.departmentId && appt.departmentId !== session.departmentId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(appt);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("appointments.manage");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { id } = await params;
  const body = await req.json();
  const { departmentId, doctorId, appointmentDate, appointmentType, notes, status, reminderSent } = body;

  try {
    const data: Record<string, unknown> = {};
    if (appointmentDate !== undefined) data.appointmentDate = new Date(appointmentDate);
    if (appointmentType !== undefined) data.appointmentType = appointmentType ? String(appointmentType).trim() : null;
    if (notes !== undefined) data.notes = notes ? String(notes).trim() : null;
    if (status !== undefined) data.status = status;
    if (reminderSent !== undefined) data.reminderSent = reminderSent;

    if (departmentId !== undefined) {
      const department = await prisma.department.findUnique({ where: { id: parseInt(departmentId, 10) } });
      if (!department || !department.active) {
        return NextResponse.json({ error: "Invalid or inactive department." }, { status: 400 });
      }
      data.departmentId = department.id;
      // If reassigning department, clear an out-of-department doctor.
      if (doctorId === undefined) {
        data.doctorId = null;
        data.doctorName = null;
      }
    }

    if (doctorId !== undefined) {
      if (!doctorId) {
        data.doctorId = null;
        data.doctorName = null;
      } else {
        const targetDeptId = (data.departmentId as number | undefined) ?? undefined;
        const doctor = await prisma.user.findFirst({
          where: {
            id: parseInt(doctorId, 10),
            role: "DOCTOR",
            ...(targetDeptId ? { departmentId: targetDeptId } : {}),
          },
        });
        if (!doctor) {
          return NextResponse.json(
            { error: "Selected doctor is not in the chosen department." },
            { status: 400 }
          );
        }
        data.doctorId = doctor.id;
        data.doctorName = doctor.name;
      }
    }

    const appt = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data,
      include: APPT_INCLUDE,
    });
    return NextResponse.json(appt);
  } catch {
    return NextResponse.json({ error: "Not found or server error." }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("appointments.manage");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { id } = await params;
  try {
    await prisma.appointment.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
