import { NextResponse } from "next/server";
import { requireAuth, type JWTPayload } from "@/lib/auth";
import { jsonError } from "@/lib/api/response";

export type GuardResult =
  | { session: JWTPayload; response?: undefined }
  | { session?: undefined; response: NextResponse };

/**
 * Authenticates (and optionally authorizes by role) an incoming request.
 *
 * On success returns `{ session }`. On failure returns `{ response }` holding a
 * 401 (unauthenticated) or 403 (wrong role) JSON error that the caller should
 * return directly:
 *
 *   const auth = await guard(["ADMIN"], { label: "USERS LIST" });
 *   if (auth.response) return auth.response;
 *   const session = auth.session;
 *
 * When `label` is provided, the current user is logged on success and auth
 * failures are logged, mirroring the previous per-route logging.
 */
export async function guard(
  allowedRoles?: string[],
  options?: { label?: string }
): Promise<GuardResult> {
  const label = options?.label;
  try {
    const session = await requireAuth(allowedRoles);
    if (label) {
      console.log(`[${label}] current user:`, {
        userId: session.userId,
        username: session.username,
        role: session.role,
        name: session.name,
      });
    }
    return { session };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message === "Unauthorized" ? 401 : 403;
    if (label) {
      console.error(`[${label}] auth failed`, { error: message });
    }
    return { response: jsonError(status === 401 ? "Unauthorized" : "Forbidden", status) };
  }
}
