import { NextRequest, NextResponse } from "next/server";
import { prisma, isRecordNotFoundError } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

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
  } catch (err) {
    if (isRecordNotFoundError(err)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    console.error("[USERS] delete failed", { id, error: err });
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
