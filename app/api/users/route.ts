import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api/guard";

export async function GET() {
  const auth = await guard(["ADMIN"]);
  if (auth.response) return auth.response;

  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
