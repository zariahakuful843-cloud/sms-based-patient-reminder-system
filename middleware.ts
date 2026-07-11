import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { can, homeFor, requiredPermissionForPath } from "@/lib/rbac";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-in-production"
);

// Paths that never require authentication.
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/login"];

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  // API routes enforce their own auth and return proper JSON 401/403 responses
  // via requireAuth/requirePermission. Redirecting them would break clients,
  // so the middleware only guards page navigation.
  if (pathname.startsWith("/api")) return NextResponse.next();

  const token = request.cookies.get("auth_token")?.value;

  const redirectToLogin = () => {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  };

  if (!token) return redirectToLogin();

  let role: string;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    role = String((payload as { role?: unknown }).role ?? "");
  } catch {
    return redirectToLogin();
  }

  // Send the generic /dashboard entry to the role-specific home.
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  // Enforce area permissions server-side (real protection, not just UI hiding).
  const required = requiredPermissionForPath(pathname);
  if (required && !can(role, required)) {
    return NextResponse.redirect(new URL(homeFor(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
