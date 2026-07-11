import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, authErrorStatus } from "@/lib/auth";

// A doctor claims an unassigned appointment in their own department. Uses a
// conditional update so two doctors cannot claim the same patient.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requirePermission("consultation.manage");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { id } = await params;
  const appointmentId = parseInt(id, 10);

  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (session.departmentId != null && appt.departmentId !== session.departmentId) {
    return NextResponse.json({ error: "Patient is not in your department." }, { status: 403 });
  }
  if (appt.doctorId != null && appt.doctorId !== session.userId) {
    return NextResponse.json({ error: "Patient already claimed by another doctor." }, { status: 409 });
  }

  const doctor = await prisma.user.findUnique({ where: { id: session.userId } });

  // Conditional update: only succeeds while still unclaimed.
  const result = await prisma.appointment.updateMany({
    where: { id: appointmentId, doctorId: null },
    data: {
      doctorId: session.userId,
      doctorName: doctor?.name ?? session.name,
      claimedAt: new Date(),
      queueStatus: "WITH_DOCTOR",
    },
  });

  if (result.count === 0 && appt.doctorId !== session.userId) {
    return NextResponse.json({ error: "Patient already claimed by another doctor." }, { status: 409 });
  }

  const updated = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { id: true, fullName: true } },
      department: { select: { id: true, name: true, code: true } },
      doctor: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}
