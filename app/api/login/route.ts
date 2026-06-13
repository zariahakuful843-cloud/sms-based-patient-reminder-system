import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

// NOTE:
// The deployed app is currently making a POST request to `/login`.
// This API route ensures that POST /api/login works, without relying on the `/api/auth/login` route.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body as { username: string; password: string };

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({ success: true, role: user.role, name: user.name });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
  console.error("LOGIN ERROR:", error);

  return NextResponse.json(
    {
      error: "Server error.",
      details: error instanceof Error ? error.message : String(error),
    },
    { status: 500 }
  );
}

