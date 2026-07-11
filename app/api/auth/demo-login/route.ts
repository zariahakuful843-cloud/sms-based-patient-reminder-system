import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { isDemoMode, DEMO_USERS } from "@/lib/demo";
import { toRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// Database-free mock login for UI review on preview deployments only.
export async function POST(req: NextRequest) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Demo login is not available." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { role?: string };
  const role = toRole(body.role);
  if (!role) {
    return NextResponse.json({ error: "Invalid demo role." }, { status: 400 });
  }

  const user = DEMO_USERS[role];
  const token = await signToken({
    userId: user.userId,
    username: user.username,
    role,
    name: user.name,
    department: user.department,
  });

  const response = NextResponse.json({ success: true, role, name: user.name });
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}
