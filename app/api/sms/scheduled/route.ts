import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { ReminderType } from "@/lib/sms";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(["ADMIN", "RECEPTIONIST"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  try {
    await requireAuth(["ADMIN", "RECEPTIONIST"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      patientId,
      reminderType,
      message,
      phoneNumber,
      scheduledAt,
    } = body as {
      patientId: number;
      reminderType: ReminderType;
      message: string;
      phoneNumber?: string;
      scheduledAt: string;
    };

    if (!patientId || !reminderType || !message || !scheduledAt) {
      return NextResponse.json({ error: "patientId, reminderType, message, and scheduledAt are required." }, { status: 400 });
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

