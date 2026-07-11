import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, authErrorStatus } from "@/lib/auth";

// Doctors for the appointment form's doctor dropdown. When a departmentId is
// provided, only doctors assigned to that department are returned.
export async function GET(req: NextRequest) {
  try {
    await requirePermission("appointments.manage");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { searchParams } = new URL(req.url);
  const departmentIdRaw = searchParams.get("departmentId");
  const departmentId = departmentIdRaw ? parseInt(departmentIdRaw, 10) : null;

  const doctors = await prisma.user.findMany({
    where: {
      role: "DOCTOR",
      active: true,
      ...(departmentId ? { departmentId } : {}),
    },
    select: { id: true, name: true, departmentId: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(doctors);
}
