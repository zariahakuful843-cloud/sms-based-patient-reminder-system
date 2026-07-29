import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(["ADMIN", "RECEPTIONIST"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") ?? "";
  const limit = parseInt(searchParams.get("limit") ?? "100");

  const users = await prisma.user.findMany({
    where: role ? { role } : undefined,
    select: { id: true, username: true, email: true, role: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ users });
}
