import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  let session;

  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") ?? "";
  const page = Math.max(
    1,
    parseInt(searchParams.get("page") ?? "1")
  );

  const limit = Math.min(
    200,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20"))
  );

  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      {
        fullName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        phoneNumber: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  /*
   * Doctors only see patients assigned to them.
   */
  if (session.role === "DOCTOR") {
    where.doctorId = session.userId;
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    }),

    prisma.patient.count({
      where,
    }),
  ]);

  return NextResponse.json({
    patients,
    total,
    page,
    limit,
  });
}

export async function POST(req: NextRequest) {
  /*
 * Only Medical Records Officers register patients.
 */
  try {
    await requireAuth(["MEDICAL_RECORDS_OFFICER"]);
  } catch {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    const {
      fullName,
      gender,
      phoneNumber,
      address,
      dateOfBirth,
      doctorId,
    } = body;

    if (
      !fullName ||
      !gender ||
      !phoneNumber ||
      !address ||
      !dateOfBirth ||
      !doctorId
    ) {
      return NextResponse.json(
        {
          error:
            "Patient details and assigned doctor are required.",
        },
        { status: 400 }
      );
    }

    const parsedDoctorId = Number(doctorId);

    if (!Number.isInteger(parsedDoctorId) || parsedDoctorId <= 0) {
      return NextResponse.json(
        {
          error: "Invalid doctor selected.",
        },
        { status: 400 }
      );
    }

    /*
     * Make sure the selected user actually exists
     * and is a doctor.
     */
    const doctor = await prisma.user.findFirst({
      where: {
        id: parsedDoctorId,
        role: "DOCTOR",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        {
          error: "Selected doctor was not found.",
        },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        fullName: String(fullName).trim(),
        gender: String(gender).trim(),
        phoneNumber: String(phoneNumber).trim(),
        address: String(address).trim(),
        dateOfBirth: new Date(dateOfBirth),
        doctorId: parsedDoctorId,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(patient, {
      status: 201,
    });
  } catch (error) {
    console.error("[PATIENT CREATE ERROR]", error);

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
