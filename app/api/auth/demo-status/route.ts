import { NextResponse } from "next/server";
import { isDemoMode, DEMO_ROLES } from "@/lib/demo";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    enabled: isDemoMode(),
    roles: isDemoMode() ? DEMO_ROLES : [],
  });
}
