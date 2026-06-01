import { NextRequest, NextResponse } from "next/server";

function deleteAuthCookie(res: NextResponse) {
  // Must match the cookie options used when setting `auth_token`.
  res.cookies.delete({ name: "auth_token", path: "/" });
}

// Do NOT redirect from the API route.
// The client should navigate to /login after success.
export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ success: true });
  deleteAuthCookie(res);
  return res;
}

// Keep GET supported to prevent 405 from any prefetch/navigation.
export async function GET(_req: NextRequest) {
  const res = NextResponse.json({ success: true });
  deleteAuthCookie(res);
  return res;
}

