import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/demo";

export const dynamic = "force-dynamic";

// Returns the signed-in user's profile. Falls back to session data in demo mode
// (no database record exists for mock users).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = isDemoMode()
    ? null
    : await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          department: { select: { name: true, code: true } },
        },
      });

  if (dbUser) {
    return NextResponse.json({
      id: dbUser.id,
      name: dbUser.name,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role,
      active: dbUser.active,
      createdAt: dbUser.createdAt,
      department: dbUser.department?.name ?? null,
    });
  }

  return NextResponse.json({
    id: session.userId,
    name: session.name,
    username: session.username,
    email: `${session.username}@example.com`,
    role: session.role,
    active: true,
    createdAt: null,
    department: session.department ?? null,
  });
}
