import { NextRequest } from "next/server";
import { handleLogin } from "@/lib/api/login";

export async function POST(req: NextRequest) {
  return handleLogin(req);
}
