import { ROLES, type Role } from "./rbac";

// Demo mode powers a database-free "mock login" so the UI can be reviewed on a
// Vercel Preview deployment without a database or real accounts.
//
// It is enabled ONLY on Vercel Preview deployments (VERCEL_ENV === "preview")
// or when DEMO_LOGIN=1 is set explicitly (used for local review). It is NEVER
// enabled on production (VERCEL_ENV === "production"), so real deployments are
// unaffected and no auth bypass can reach production.
export function isDemoMode(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.VERCEL_ENV === "preview" || process.env.DEMO_LOGIN === "1";
}

// A fixed set of mock users, one per role, used only in demo mode.
export const DEMO_USERS: Record<Role, { userId: number; username: string; name: string }> = {
  ADMIN: { userId: 9001, username: "demo.admin", name: "Demo Admin" },
  RECEPTIONIST: { userId: 9002, username: "demo.receptionist", name: "Demo Receptionist" },
  NURSE: { userId: 9003, username: "demo.nurse", name: "Demo Nurse" },
  DOCTOR: { userId: 9004, username: "demo.doctor", name: "Demo Doctor" },
};

export const DEMO_ROLES = ROLES;
