import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { isQueueStatus } from "@/lib/queue";

// Update the queue status of an appointment. Nurses (queue.manage) and doctors
// (consultation.manage) may advance the patient's journey.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "queue.manage") && !can(session.role, "consultation.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const appointmentId = parseInt(id, 10);
  const body = await req.json();
  const queueStatus = String(body.queueStatus ?? "");

  if (!isQueueStatus(queueStatus)) {
    return NextResponse.json({ error: "Invalid queue status." }, { status: 400 });
  }

  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Department-scoped staff may only touch their own department's queue.
  if (session.departmentId != null && appt.departmentId !== session.departmentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { queueStatus },
    include: {
      patient: { select: { id: true, fullName: true } },
      department: { select: { id: true, name: true, code: true } },
      doctor: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}
