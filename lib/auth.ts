import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { can, normalizeRole, type Permission } from "./rbac";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-in-production"
);

export type JWTPayload = {
  userId: number;
  username: string;
  role: string;
  name: string;
};

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(allowedRoles?: string[]): Promise<JWTPayload> {
  const session = await getSession();
  const detectedRole = session?.role ?? "ANONYMOUS";

  // Ensure role matching is robust (case/whitespace)
  const normalizedDetectedRole = normalizeRole(detectedRole);
  const normalizedAllowedRoles = allowedRoles?.map(normalizeRole) ?? undefined;

  if (!session) {
    console.warn("[AUTH] Denied: not authenticated", { detectedRole: normalizedDetectedRole });
    throw new Error("Unauthorized");
  }

  if (normalizedAllowedRoles && !normalizedAllowedRoles.includes(normalizedDetectedRole)) {
    console.warn("[AUTH] Denied: forbidden role", {
      detectedRole: normalizedDetectedRole,
      allowedRoles: normalizedAllowedRoles,
    });
    throw new Error("Forbidden");
  }

  // Return session but with normalized role so downstream checks/logs are consistent.
  return {
    ...session,
    role: normalizedDetectedRole,
  };
}

// Permission-based guard. Prefer this over role arrays: routes declare the
// permission they need and the RBAC matrix (lib/rbac.ts) decides access.
// Throws "Unauthorized" (no session) or "Forbidden" (missing permission).
export async function requirePermission(
  permission: Permission
): Promise<JWTPayload> {
  const session = await getSession();

  if (!session) {
    console.warn("[AUTH] Denied: not authenticated", { permission });
    throw new Error("Unauthorized");
  }

  const role = normalizeRole(session.role);
  if (!can(role, permission)) {
    console.warn("[AUTH] Denied: missing permission", { role, permission });
    throw new Error("Forbidden");
  }

  return { ...session, role };
}

// Map an auth error thrown above to an HTTP status code.
export function authErrorStatus(err: unknown): 401 | 403 {
  const msg = err instanceof Error ? err.message : String(err);
  return msg === "Unauthorized" ? 401 : 403;
}


