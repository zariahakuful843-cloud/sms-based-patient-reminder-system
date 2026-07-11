import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api/guard";
import { jsonError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const auth = await guard(["ADMIN"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { username, email, password, role, name } = body as {
      username: string;
      email: string;
      password: string;
      role: string;
      name: string;
    };

    if (!username || !email || !password || !role || !name) {
      return jsonError("All fields are required.", 400);
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      return jsonError("Username or email already exists.", 409);
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, email, password: hashed, role: role.toUpperCase(), name },
      select: { id: true, username: true, email: true, role: true, name: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return jsonError("Server error.", 500);
  }
}
