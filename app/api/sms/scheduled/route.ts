import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api/guard";
import { jsonError } from "@/lib/api/response";
import { getPagination } from "@/lib/api/pagination";
import type { ReminderType } from "@/lib/sms";

const STAFF_ROLES = ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"];

export async function GET(req: NextRequest) {
  console.log("[SMS ENDPOINT] endpoint called:", "GET /api/sms/scheduled");
  const auth = await guard(STAFF_ROLES, { label: "SMS SCHEDULED LIST" });
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";
  const { page, limit, skip } = getPagination(searchParams);

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
  console.log("[SMS ENDPOINT] endpoint called:", "POST /api/sms/scheduled");
  const auth = await guard(STAFF_ROLES, { label: "SMS SCHEDULED CREATE" });
  if (auth.response) return auth.response;

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
      return jsonError("patientId, reminderType, message, and scheduledAt are required.", 400);
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return jsonError("Patient not found.", 404);

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
    return jsonError("Server error.", 500);
  }
}
