import { NextRequest } from "next/server";
import { handleLogin } from "@/lib/api/login";

// NOTE:
// The deployed app is currently making a POST request to `/login`.
// This API route ensures that POST /api/login works, without relying on the `/api/auth/login` route.

export async function POST(req: NextRequest) {
  return handleLogin(req);
}
