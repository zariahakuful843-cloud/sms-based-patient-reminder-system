import { toRole } from "./rbac";

export type ScopeSession = {
  userId: number;
  role: string;
  departmentId?: number | null;
};

// Returns a Prisma `where` fragment that limits appointment visibility by role:
// - NURSE: only their department.
// - DOCTOR: their department, and only appointments assigned to them or not yet
//   assigned to any doctor (claimable).
// - ADMIN / RECEPTIONIST: no restriction (whole hospital).
export function appointmentScopeWhere(session: ScopeSession): Record<string, unknown> {
  const role = toRole(session.role);
  if (role === "NURSE") {
    return session.departmentId ? { departmentId: session.departmentId } : {};
  }
  if (role === "DOCTOR") {
    if (!session.departmentId) return { doctorId: session.userId };
    return {
      departmentId: session.departmentId,
      OR: [{ doctorId: session.userId }, { doctorId: null }],
    };
  }
  return {};
}
