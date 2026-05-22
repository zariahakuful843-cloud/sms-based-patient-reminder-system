import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePatientSchema = z.object({
  name: z.string().min(2).optional(),
  phoneNumber: z
    .string()
    .regex(/^\+233\d{9}$/, "Phone must be Ghana format: +233XXXXXXXXX")
    .optional(),
  dateOfBirth: z.string().nullable().optional(),
  gender: z.enum(["Male", "Female", "Other"]).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: { orderBy: { appointmentDate: "desc" }, take: 10 },
      messages: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json(patient);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = updatePatientSchema.parse(body);

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
        ...(data.dateOfBirth !== undefined && {
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return NextResponse.json(patient);
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.patient.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
