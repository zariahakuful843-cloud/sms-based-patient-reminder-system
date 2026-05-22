import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPatientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z
    .string()
    .regex(/^\+233\d{9}$/, "Phone must be Ghana format: +233XXXXXXXXX"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { phoneNumber: { contains: search } },
        ],
      }
    : {};

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ]);

  return NextResponse.json({ patients, total, page, limit });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createPatientSchema.parse(body);

    const patient = await prisma.patient.create({
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(patient, { status: 201 });
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
