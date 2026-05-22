import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const templates = await prisma.messageTemplate.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const template = await prisma.messageTemplate.upsert({
    where: { name: body.name },
    update: { content: body.content },
    create: { name: body.name, content: body.content },
  });

  return NextResponse.json(template);
}
