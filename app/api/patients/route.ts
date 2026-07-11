import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api/guard";
import { jsonError } from "@/lib/api/response";
import { getPagination } from "@/lib/api/pagination";

export async function GET(req: NextRequest) {
  const auth = await guard();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const { page, limit, skip } = getPagination(searchParams);

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
  const auth = await guard(["ADMIN", "RECEPTIONIST"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { fullName, gender, phoneNumber, address, dateOfBirth } = body;

    if (!fullName || !gender || !phoneNumber || !address || !dateOfBirth) {
      return jsonError("All fields are required.", 400);
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
    return jsonError("Server error.", 500);
  }
}
