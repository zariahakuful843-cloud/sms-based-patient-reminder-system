import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, authErrorStatus, getSession } from "@/lib/auth";

// List departments. Any authenticated user can read the department list (needed
// for appointment booking / filters); only admins can mutate.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("activeOnly") === "1";

  const departments = await prisma.department.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, appointments: true } } },
  });

  return NextResponse.json(departments);
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("departments.manage");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const code = String(body.code ?? "").trim().toUpperCase();
    const description = body.description ? String(body.description).trim() : null;

    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required." }, { status: 400 });
    }

    const exists = await prisma.department.findFirst({
      where: { OR: [{ name }, { code }] },
    });
    if (exists) {
      return NextResponse.json({ error: "A department with that name or code already exists." }, { status: 409 });
    }

    const department = await prisma.department.create({
      data: { name, code, description },
    });
    return NextResponse.json(department, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
