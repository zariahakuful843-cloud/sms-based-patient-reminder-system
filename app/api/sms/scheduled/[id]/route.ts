import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api/guard";
import { jsonError } from "@/lib/api/response";

const STAFF_ROLES = ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log("[SMS ENDPOINT] endpoint called:", "GET /api/sms/scheduled/[id]");
  const auth = await guard(STAFF_ROLES, { label: "SMS SCHEDULED ITEM" });
  if (auth.response) return auth.response;

  const { id } = await params;

  const item = await prisma.scheduledReminder.findUnique({ where: { id: parseInt(id) } });
  if (!item) return jsonError("Not found", 404);
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log("[SMS ENDPOINT] endpoint called:", "PUT /api/sms/scheduled/[id]");
  const auth = await guard(STAFF_ROLES, { label: "SMS SCHEDULED ITEM" });
  if (auth.response) return auth.response;

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
    return jsonError("Server error.", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log("[SMS ENDPOINT] endpoint called:", "DELETE /api/sms/scheduled/[id]");
  const auth = await guard(STAFF_ROLES, { label: "SMS SCHEDULED ITEM" });
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    await prisma.scheduledReminder.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return jsonError("Not found.", 404);
  }
}
