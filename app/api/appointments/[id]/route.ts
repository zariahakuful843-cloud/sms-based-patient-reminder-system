import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      ...(body.appointmentDate && {
        appointmentDate: new Date(body.appointmentDate),
      }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.status && { status: body.status }),
    },
    include: { patient: true },
  });

  if (body.status === "CANCELLED") {
    await prisma.reminder.updateMany({
      where: { appointmentId: id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  }

  return NextResponse.json(appointment);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
