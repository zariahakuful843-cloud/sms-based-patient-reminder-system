import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    const created = await prisma.systemSettings.create({
      data: { id: "default" },
    });
    return NextResponse.json(created);
  }

  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  const settings = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {
      ...(body.reminderHoursBefore !== undefined && {
        reminderHoursBefore: body.reminderHoursBefore,
      }),
      ...(body.reminderEnabled !== undefined && {
        reminderEnabled: body.reminderEnabled,
      }),
      ...(body.facilityName !== undefined && {
        facilityName: body.facilityName,
      }),
    },
    create: {
      id: "default",
      reminderHoursBefore: body.reminderHoursBefore ?? 24,
      reminderEnabled: body.reminderEnabled ?? true,
      facilityName: body.facilityName ?? "Health Facility",
    },
  });

  return NextResponse.json(settings);
}
