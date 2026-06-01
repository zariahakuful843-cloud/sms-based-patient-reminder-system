import { NextRequest, NextResponse } from "next/server";

function redirectToLogin(req: NextRequest) {
  return NextResponse.redirect(new URL("/login", req.url));
}

function deleteAuthCookie(res: NextResponse) {
  // Matches the cookie options used when setting `auth_token`.
  res.cookies.delete({ name: "auth_token", path: "/" });
}

// Logout form sends a POST. Ensure we accept POST to avoid 405.
export async function POST(req: NextRequest) {
  const res = redirectToLogin(req);
  deleteAuthCookie(res);
  return res;
}

// Some clients may issue GET (e.g., prefetch). Keep it safe.
export async function GET(req: NextRequest) {
  const res = redirectToLogin(req);
  deleteAuthCookie(res);
  return res;
}

