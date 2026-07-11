import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, authErrorStatus } from "@/lib/auth";
import { appointmentScopeWhere } from "@/lib/scope";

// Today's queue for the logged-in clinical user, scoped by department/role.
export async function GET(_req: NextRequest) {
  let session;
  try {
    session = await requirePermission("appointments.read");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const where: Record<string, unknown> = {
    ...appointmentScopeWhere(session),
    appointmentDate: { gte: start, lt: end },
  };

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: [{ queueNumber: "asc" }, { appointmentDate: "asc" }],
    include: {
      patient: { select: { id: true, fullName: true, phoneNumber: true } },
      department: { select: { id: true, name: true, code: true } },
      doctor: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ appointments });
}
