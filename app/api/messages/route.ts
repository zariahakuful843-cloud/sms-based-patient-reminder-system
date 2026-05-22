import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendSMS } from "@/lib/sms";

const sendMessageSchema = z.object({
  patientId: z.string().min(1),
  content: z.string().min(1),
  appointmentId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");

  const where = status ? { status: status as "PENDING" | "SENT" | "DELIVERED" | "FAILED" } : {};

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: { patient: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where }),
  ]);

  return NextResponse.json({ messages, total, page, limit });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = sendMessageSchema.parse(body);

    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const message = await prisma.message.create({
      data: {
        patientId: data.patientId,
        appointmentId: data.appointmentId || null,
        content: data.content,
        status: "PENDING",
      },
    });

    const result = await sendSMS(patient.phoneNumber, data.content);

    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: result.success ? "SENT" : "FAILED",
        sentAt: result.success ? new Date() : null,
        providerRef: result.messageId || null,
      },
    });

    return NextResponse.json(
      { ...message, status: result.success ? "SENT" : "FAILED" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
