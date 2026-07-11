import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth, authErrorStatus } from "@/lib/auth";
import { canSendReminderType } from "@/lib/rbac";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("sms.history.read");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { id } = await params;
  const item = await prisma.scheduledReminder.findUnique({ where: { id: parseInt(id) } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireAuth();
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      reminderType,
      patientId,
      message,
      phoneNumber,
      scheduledAt,
      status,
      patientName,
    } = body as {
      reminderType?: string;
      patientId?: number;
      patientName?: string;
      phoneNumber?: string;
      message?: string;
      scheduledAt?: string;
      status?: string;
    };

    const existing = await prisma.scheduledReminder.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

    // The caller must be allowed to manage the existing reminder type, and
    // (if changing type) the new type as well.
    if (!canSendReminderType(session.role, existing.reminderType)) {
      return NextResponse.json({ error: "Your role is not permitted to manage this reminder." }, { status: 403 });
    }
    if (reminderType !== undefined && !canSendReminderType(session.role, reminderType)) {
      return NextResponse.json(
        { error: `Your role is not permitted to create ${reminderType} reminders.` },
        { status: 403 }
      );
    }

    const updated = await prisma.scheduledReminder.update({
      where: { id: parseInt(id) },
      data: {
        ...(reminderType !== undefined && { reminderType }),
        ...(message !== undefined && { message }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
        ...(status !== undefined && { status }),
        ...(patientId !== undefined && { patientId }),
        ...(patientName !== undefined && { patientName }),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireAuth();
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { id } = await params;
  const existing = await prisma.scheduledReminder.findUnique({ where: { id: parseInt(id) } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (!canSendReminderType(session.role, existing.reminderType)) {
    return NextResponse.json({ error: "Your role is not permitted to manage this reminder." }, { status: 403 });
  }

  try {
    await prisma.scheduledReminder.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
