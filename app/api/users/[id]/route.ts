import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api/guard";
import { jsonError } from "@/lib/api/response";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guard(["ADMIN"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  try {
    await prisma.user.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Not found.", 404);
  }
}
