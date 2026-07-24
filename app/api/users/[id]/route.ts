import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const { name, username, email, password, role } = body ?? {};
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = String(name);
  if (username !== undefined) data.username = String(username);
  if (email !== undefined) data.email = String(email);
  if (role !== undefined) data.role = String(role).trim().toUpperCase();

  // Only touch the password if a real, non-empty new value was sent.
  // Hash it the same way login expects (bcrypt.compare in the login route).
  if (password !== undefined && String(password).trim().length > 0) {
    data.password = await bcrypt.hash(String(password), 10);
  }

  try {
    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: data as any,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /users/[id] failed:", err);

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return NextResponse.json({ error: "Not found." }, { status: 404 });
      }
      if (err.code === "P2002") {
        const target = (err.meta?.target as string[])?.join(", ");
        return NextResponse.json(
          { error: `That ${target || "value"} is already in use.` },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await prisma.user.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
