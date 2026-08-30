import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;

  try {
    session = await requireAuth([
      "ADMIN",
      "MEDICAL_RECORDS_OFFICER",
      "NURSE",
      "DOCTOR",
    ]);
  } catch {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const patientId = parseInt(id);

  if (Number.isNaN(patientId)) {
    return NextResponse.json(
      { error: "Invalid patient ID." },
      { status: 400 }
    );
  }

  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId,
    },

    include: {
      doctor: {
        select: {
          id: true,
          name: true,
        },
      },

      appointments: {
        orderBy: {
          appointmentDate: "desc",
        },
        take: 10,
      },

      smsLogs: {
        orderBy: {
          sentAt: "desc",
        },
        take: 10,
      },
    },
  });

  if (!patient) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  /*
   * Doctors can only view patients assigned to them.
   */
  if (
    session.role === "DOCTOR" &&
    patient.doctorId !== session.userId
  ) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(patient);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(["MEDICAL_RECORDS_OFFICER"]);
  } catch {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const patientId = parseInt(id);

  if (Number.isNaN(patientId)) {
    return NextResponse.json(
      { error: "Invalid patient ID." },
      { status: 400 }
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

    const patient = await prisma.patient.update({
      where: {
        id: patientId,
      },

      data: {
        ...(fullName && {
          fullName: fullName.trim(),
        }),

        ...(gender && {
          gender,
        }),

        ...(phoneNumber && {
          phoneNumber: phoneNumber.trim(),
        }),

        ...(address && {
          address: address.trim(),
        }),

        ...(dateOfBirth && {
          dateOfBirth: new Date(dateOfBirth),
        }),

        ...(doctorId && {
          doctorId: parseInt(String(doctorId)),
        }),
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

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Update patient error:", error);

    return NextResponse.json(
      { error: "Not found or server error." },
      { status: 404 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(["ADMIN"]);
  } catch {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const patientId = parseInt(id);

  if (Number.isNaN(patientId)) {
    return NextResponse.json(
      { error: "Invalid patient ID." },
      { status: 400 }
    );
  }

  try {
    await prisma.patient.delete({
      where: {
        id: patientId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Not found." },
      { status: 404 }
    );
  }
}
