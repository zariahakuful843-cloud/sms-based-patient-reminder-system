import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { jsonError } from "@/lib/api/response";

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

/**
 * Shared username/password login flow used by both `/api/login` and
 * `/api/auth/login`. Validates credentials, signs a JWT and sets the
 * `auth_token` cookie on the response.
 */
export async function handleLogin(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { username, password } = body as { username: string; password: string };

    if (!username || !password) {
      return jsonError("Username and password are required.", 400);
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return jsonError("Invalid credentials.", 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return jsonError("Invalid credentials.", 401);
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
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { error: "Server error.", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
