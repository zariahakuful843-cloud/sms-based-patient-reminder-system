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
  // RBAC + field-level authorization (Phase 2.2 authorization only)
  try {
    await requireAuth(["ADMIN", "RECEPTIONIST", "NURSE", "DOCTOR"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { doctorName, appointmentDate, notes, status, reminderSent } = body;

  // Decide allowed fields by role
  // - ADMIN: all fields
  // - RECEPTIONIST: all except notes (consultation notes)
  // - NURSE: ONLY status
  // - DOCTOR: ONLY notes
  const session = await requireAuth();
  const role = session.role;

  // Reject attempts to modify fields outside the role contract.
  const allowedData: Record<string, unknown> = {};

  if (role === "ADMIN") {
    if (doctorName !== undefined) allowedData.doctorName = String(doctorName).trim();
    if (appointmentDate !== undefined) allowedData.appointmentDate = new Date(appointmentDate);
    if (notes !== undefined) allowedData.notes = notes;
    if (status !== undefined) allowedData.status = status;
    if (reminderSent !== undefined) allowedData.reminderSent = reminderSent;
  } else if (role === "RECEPTIONIST") {
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
    // Must not modify appointment date/status/patient-related fields
    const touchedNonNotes =
      doctorName !== undefined ||
      appointmentDate !== undefined ||
      status !== undefined ||
      reminderSent !== undefined;
    if (touchedNonNotes) {
      return NextResponse.json({ error: "Forbidden: doctors can only update consultation notes." }, { status: 403 });
    }
    if (notes === undefined) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    allowedData.notes = notes;
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
