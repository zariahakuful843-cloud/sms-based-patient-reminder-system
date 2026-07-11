import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth, authErrorStatus } from "@/lib/auth";
import { canSendReminderType } from "@/lib/rbac";
import type { ReminderType } from "@/lib/sms";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("sms.history.read");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { patientName: { contains: search } },
      { phoneNumber: { contains: search } },
      { reminderType: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.scheduledReminder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.scheduledReminder.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  try {
    const body = await req.json();
    const { patientId, reminderType, message, phoneNumber, scheduledAt } = body as {
      patientId: number;
      reminderType: ReminderType;
      message: string;
      phoneNumber?: string;
      scheduledAt: string;
    };

    if (!patientId || !reminderType || !message || !scheduledAt) {
      return NextResponse.json(
        { error: "patientId, reminderType, message, and scheduledAt are required." },
        { status: 400 }
      );
    }

    // Enforce that the caller's role is allowed to create this reminder type.
    if (!canSendReminderType(session.role, reminderType)) {
      return NextResponse.json(
        { error: `Your role is not permitted to create ${reminderType} reminders.` },
        { status: 403 }
      );
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return NextResponse.json({ error: "Patient not found." }, { status: 404 });

    const item = await prisma.scheduledReminder.create({
      data: {
        patientId,
        patientName: patient.fullName,
        phoneNumber: phoneNumber ?? patient.phoneNumber,
        reminderType,
        message,
        status: "PENDING",
        scheduledAt: new Date(scheduledAt),
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
