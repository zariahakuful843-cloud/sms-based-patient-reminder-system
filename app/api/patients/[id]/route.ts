import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api/guard";
import { jsonError } from "@/lib/api/response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guard();
  if (auth.response) return auth.response;

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(id) },
    include: {
      appointments: { orderBy: { appointmentDate: "desc" }, take: 10 },
      smsLogs: { orderBy: { sentAt: "desc" }, take: 10 },
    },
  });
  if (!patient) return jsonError("Not found", 404);
  return NextResponse.json(patient);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guard(["ADMIN", "RECEPTIONIST"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const { fullName, gender, phoneNumber, address, dateOfBirth } = body;

  try {
    const patient = await prisma.patient.update({
      where: { id: parseInt(id) },
      data: {
        ...(fullName && { fullName: fullName.trim() }),
        ...(gender && { gender }),
        ...(phoneNumber && { phoneNumber: phoneNumber.trim() }),
        ...(address && { address: address.trim() }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      },
    });
    return NextResponse.json(patient);
  } catch {
    return jsonError("Not found or server error.", 404);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guard(["ADMIN"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  try {
    await prisma.patient.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Not found.", 404);
  }
}
