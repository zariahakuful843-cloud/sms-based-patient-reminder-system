import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type ImportRow = {
  fullName: string;
  gender: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string; // ISO string, already validated/converted on the client
};

export async function POST(req: NextRequest) {
  try {
    await requireAuth(["ADMIN", "RECEPTIONIST"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { rows } = body as { rows: ImportRow[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows to import." }, { status: 400 });
    }
    if (rows.length > 500) {
      return NextResponse.json({ error: "Please import 500 patients or fewer at a time." }, { status: 400 });
    }

    let imported = 0;
    const failed: { row: number; name: string; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.fullName || !r.gender || !r.phoneNumber || !r.address || !r.dateOfBirth) {
          throw new Error("Missing required field(s)");
        }
        await prisma.patient.create({
          data: {
            fullName: r.fullName.trim(),
            gender: r.gender.trim(),
            phoneNumber: r.phoneNumber.trim(),
            address: r.address.trim(),
            dateOfBirth: new Date(r.dateOfBirth),
          },
        });
        imported++;
      } catch (err: any) {
        failed.push({ row: i + 1, name: r.fullName || "(unnamed)", reason: err.message || "Unknown error" });
      }
    }

    return NextResponse.json({ imported, failed, total: rows.length }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
