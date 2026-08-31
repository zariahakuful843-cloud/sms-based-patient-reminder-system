import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const appt = await prisma.appointment.findUnique({
    where: { id: parseInt(id) },
    include: { patient: true },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Doctors can only view their own appointments.
  if (session.role === "DOCTOR" && appt.doctorId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(appt);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
const { id } = await params;
  const body = await req.json();
  const { doctorName, appointmentDate, notes, status, reminderSent } = body;

  const session = await requireAuth();
  const role = session.role;

  // Doctors can only edit their own appointments.
  if (role === "DOCTOR") {
    const existing = await prisma.appointment.findUnique({ where: { id: parseInt(id) }, select: { doctorId: true } });
    if (!existing || existing.doctorId !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  // Reject attempts to modify fields outside the role contract.
  const allowedData: Record<string, unknown> = {};

  if (role === "ADMIN") {
    // Administrator has view-only access to appointments — no editing.
    return NextResponse.json({ error: "Forbidden: administrators have view-only access to appointments." }, { status: 403 });
  } else if (role === "MEDICAL_RECORDS_OFFICER") {
    
    // Cannot update consultation notes
    if (notes !== undefined) {
      return NextResponse.json({ error: "Forbidden: cannot update consultation notes." }, { status: 403 });
    }
    if (doctorName !== undefined) allowedData.doctorName = String(doctorName).trim();
    if (appointmentDate !== undefined) allowedData.appointmentDate = new Date(appointmentDate);
    if (status !== undefined) allowedData.status = status;
    if (reminderSent !== undefined) allowedData.reminderSent = reminderSent;
  } else if (role === "NURSE") {
    // Must not touch patient details or consultation notes or other fields
    const touchedNonStatus =
      doctorName !== undefined ||
      appointmentDate !== undefined ||
      notes !== undefined ||
      reminderSent !== undefined;
    if (touchedNonStatus) {
      return NextResponse.json({ error: "Forbidden: nurses can only update appointment status." }, { status: 403 });
    }
    if (status === undefined) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    allowedData.status = status;
  } else if (role === "DOCTOR") {
    // Doctors can write consultation notes and update status (e.g. marking a visit Completed),
    // but cannot reassign the doctor or move the appointment date — that stays with Receptionist.
    const touchedDisallowed = doctorName !== undefined || appointmentDate !== undefined || reminderSent !== undefined;
    if (touchedDisallowed) {
      return NextResponse.json({ error: "Forbidden: doctors can only update notes and status." }, { status: 403 });
    }
    if (notes === undefined && status === undefined) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    if (notes !== undefined) allowedData.notes = notes;
    if (status !== undefined) allowedData.status = status;
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const appt = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: allowedData as any,
      include: { patient: true },
    });

    // If the status changed away from Scheduled, cancel any still-pending reminder for it.
    if (allowedData.status !== undefined && allowedData.status !== "SCHEDULED") {
      await prisma.scheduledReminder.updateMany({
        where: { appointmentId: appt.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
    }

    return NextResponse.json(appt);
  } catch {
    return NextResponse.json({ error: "Not found or server error." }, { status: 404 });
  }
}


export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["ADMIN", "MEDICAL_RECORDS_OFFICER"]);
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
