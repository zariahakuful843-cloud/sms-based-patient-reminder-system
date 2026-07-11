import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission, authErrorStatus } from "@/lib/auth";
import { ROLES } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    await requirePermission("users.manage");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden." }, { status });
  }

  try {
    const body = await req.json();
    const { username, email, password, role, name, departmentId } = body as {
      username: string;
      email: string;
      password: string;
      role: string;
      name: string;
      departmentId?: number | string | null;
    };

    if (!username || !email || !password || !role || !name) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const normalizedRole = role.trim().toUpperCase();
    if (!(ROLES as readonly string[]).includes(normalizedRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${ROLES.join(", ")}.` },
        { status: 400 }
      );
    }

    // Department is required for clinical staff (nurse/doctor), optional otherwise.
    const requiresDepartment = normalizedRole === "NURSE" || normalizedRole === "DOCTOR";
    let resolvedDepartmentId: number | null = null;
    if (departmentId !== undefined && departmentId !== null && departmentId !== "") {
      const deptId = parseInt(String(departmentId), 10);
      const dept = await prisma.department.findUnique({ where: { id: deptId } });
      if (!dept) {
        return NextResponse.json({ error: "Selected department does not exist." }, { status: 400 });
      }
      resolvedDepartmentId = deptId;
    }
    if (requiresDepartment && resolvedDepartmentId === null) {
      return NextResponse.json(
        { error: "Department is required for Doctor and Nurse accounts." },
        { status: 400 }
      );
    }
    if (!requiresDepartment) {
      resolvedDepartmentId = null;
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Username or email already exists." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashed,
        role: normalizedRole,
        name,
        departmentId: resolvedDepartmentId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        name: true,
        createdAt: true,
        department: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
