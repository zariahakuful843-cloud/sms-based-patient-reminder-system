import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET environment variable must be set to a strong value of at least 32 characters."
    );
  }
  return new TextEncoder().encode(secret);
}

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
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
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
  const normalizeRole = (r: string) => (r ?? "").trim().toUpperCase();
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


