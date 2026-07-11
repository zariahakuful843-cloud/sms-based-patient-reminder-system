import { NextRequest, NextResponse } from "next/server";
import { prisma, isRecordNotFoundError } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log("[SMS ENDPOINT] endpoint called:", "GET /api/sms/scheduled/[id]");
  try {
    const session = await requireAuth(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"]);
    console.log("[SMS SCHEDULED ITEM] current user:", {
      userId: session.userId,
      username: session.username,
      role: session.role,
      name: session.name,
    });
    console.log("[SMS SCHEDULED ITEM] detected role:", session.role);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { id } = await params;

  const item = await prisma.scheduledReminder.findUnique({ where: { id: parseInt(id) } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log("[SMS ENDPOINT] endpoint called:", "PUT /api/sms/scheduled/[id]");
  try {
    const session = await requireAuth(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"]);
    console.log("[SMS SCHEDULED ITEM] current user:", {
      userId: session.userId,
      username: session.username,
      role: session.role,
      name: session.name,
    });
    console.log("[SMS SCHEDULED ITEM] detected role:", session.role);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg === "Unauthorized" ? 401 : 403;
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
  } catch (err) {
    if (isRecordNotFoundError(err)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    console.error("[SMS SCHEDULED ITEM] update failed", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  console.log("[SMS ENDPOINT] endpoint called:", "DELETE /api/sms/scheduled/[id]");
  try {
    const session = await requireAuth(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"]);
    console.log("[SMS SCHEDULED ITEM] current user:", {
      userId: session.userId,
      username: session.username,
      role: session.role,
      name: session.name,
    });
    console.log("[SMS SCHEDULED ITEM] detected role:", session.role);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { id } = await params;

  try {
    await prisma.scheduledReminder.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    if (isRecordNotFoundError(err)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    console.error("[SMS SCHEDULED ITEM] delete failed", { id, error: err });
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}


