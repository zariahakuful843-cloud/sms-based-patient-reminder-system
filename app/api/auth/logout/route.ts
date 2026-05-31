import { NextRequest, NextResponse } from "next/server";

function redirectToLogin(req: NextRequest) {
  // Redirect to the same host (important for Vercel deployments).
  return NextResponse.redirect(new URL("/login", req.url));
}

export async function POST(req: NextRequest) {
  const res = redirectToLogin(req);
  res.cookies.delete({ name: "auth_token", path: "/" });
  return res;
}

export async function GET(req: NextRequest) {
  const res = redirectToLogin(req);
  res.cookies.delete({ name: "auth_token", path: "/" });
  return res;
}

