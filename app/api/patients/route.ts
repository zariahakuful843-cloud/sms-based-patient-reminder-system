import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, authErrorStatus } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("patients.read");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { fullName: { contains: search } },
          { phoneNumber: { contains: search } },
        ],
      }
    : {};

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { appointments: true } },
      },
    }),
    prisma.patient.count({ where }),
  ]);

  return NextResponse.json({ patients, total, page, limit });
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("patients.create");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  try {
    const body = await req.json();
    const { fullName, gender, phoneNumber, address, dateOfBirth } = body;

    if (!fullName || !gender || !phoneNumber || !address || !dateOfBirth) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const patient = await prisma.patient.create({
      data: {
        fullName: fullName.trim(),
        gender,
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        dateOfBirth: new Date(dateOfBirth),
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
