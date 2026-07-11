import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, authErrorStatus } from "@/lib/auth";
import { isDepartmentScoped } from "@/lib/rbac";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requirePermission("patients.read");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(id) },
    include: {
      appointments: { orderBy: { appointmentDate: "desc" }, take: 10 },
      smsLogs: { orderBy: { sentAt: "desc" }, take: 10 },
    },
  });
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Nurses and doctors may only view patients seen in their own department.
  if (isDepartmentScoped(session.role) && session.departmentId) {
    const inDept = await prisma.appointment.count({
      where: { patientId: patient.id, departmentId: session.departmentId },
    });
    if (inDept === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(patient);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("patients.update");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

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
    return NextResponse.json({ error: "Not found or server error." }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("patients.delete");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { id } = await params;
  try {
    await prisma.patient.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
