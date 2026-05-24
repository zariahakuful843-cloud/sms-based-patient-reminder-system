import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const appt = await prisma.appointment.findUnique({
    where: { id: parseInt(id) },
    include: { patient: true },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(appt);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["ADMIN", "RECEPTIONIST"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    return NextResponse.json({ error: "Not found or server error." }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["ADMIN", "RECEPTIONIST"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.appointment.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
