import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api/guard";
import { jsonError } from "@/lib/api/response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guard();
  if (auth.response) return auth.response;

  const { id } = await params;
  const appt = await prisma.appointment.findUnique({
    where: { id: parseInt(id) },
    include: { patient: true },
  });
  if (!appt) return jsonError("Not found", 404);
  return NextResponse.json(appt);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guard(["ADMIN", "RECEPTIONIST"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const { doctorName, appointmentDate, notes, status, reminderSent } = body;

  try {
    const appt = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        ...(doctorName !== undefined && { doctorName: doctorName.trim() }),
        ...(appointmentDate !== undefined && { appointmentDate: new Date(appointmentDate) }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
        ...(reminderSent !== undefined && { reminderSent }),
      },
      include: { patient: true },
    });
    return NextResponse.json(appt);
  } catch {
    return jsonError("Not found or server error.", 404);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guard(["ADMIN", "RECEPTIONIST"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  try {
    await prisma.appointment.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Not found.", 404);
  }
}
