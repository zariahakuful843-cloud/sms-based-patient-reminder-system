// Central Role-Based Access Control (RBAC) definitions.
//
// This module is the single source of truth for roles, permissions, and the
// mapping between them. It is intentionally dependency-free so it can be used
// from server route handlers (Node runtime), client components, and the Edge
// middleware alike.

export const ROLES = ["ADMIN", "RECEPTIONIST", "NURSE", "DOCTOR"] as const;
export type Role = (typeof ROLES)[number];

export type Permission =
  // Admin scope
  | "users.manage"
  | "settings.manage"
  | "reports.view"
  | "departments.manage"
  // Reception scope
  | "patients.create"
  | "patients.update"
  | "patients.read"
  | "patients.delete"
  | "appointments.manage"
  | "appointments.read"
  | "appointment.reminders.send"
  | "sms.history.read"
  | "sms.manage"
  // Nurse scope
  | "queue.manage"
  | "vitals.record"
  | "vitals.read"
  | "medication.reminders.create"
  | "followup.reminders.create"
  | "vaccination.reminders.create"
  | "antenatal.reminders.create"
  // Doctor scope
  | "patient.history.read"
  | "consultation.manage"
  | "diagnosis.write"
  | "treatment.write"
  | "laboratory.reminders.create";

const RECEPTIONIST_PERMISSIONS: Permission[] = [
  "patients.create",
  "patients.update",
  "patients.read",
  "appointments.manage",
  "appointments.read",
  "appointment.reminders.send",
  "sms.history.read",
];

const NURSE_PERMISSIONS: Permission[] = [
  "patients.read",
  "appointments.read",
  "queue.manage",
  "vitals.record",
  "vitals.read",
  "medication.reminders.create",
  "followup.reminders.create",
  "vaccination.reminders.create",
  "sms.history.read",
];

const DOCTOR_PERMISSIONS: Permission[] = [
  "patients.read",
  "patient.history.read",
  "appointments.read",
  "vitals.read",
  "consultation.manage",
  "diagnosis.write",
  "treatment.write",
  "laboratory.reminders.create",
  "medication.reminders.create",
  "followup.reminders.create",
  "sms.history.read",
];

// ADMIN has full access to every permission in the system.
const ALL_PERMISSIONS: Permission[] = Array.from(
  new Set<Permission>([
    "users.manage",
    "settings.manage",
    "reports.view",
    "departments.manage",
    "patients.delete",
    "sms.manage",
    "antenatal.reminders.create",
    ...RECEPTIONIST_PERMISSIONS,
    ...NURSE_PERMISSIONS,
    ...DOCTOR_PERMISSIONS,
  ])
);

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ALL_PERMISSIONS,
  RECEPTIONIST: RECEPTIONIST_PERMISSIONS,
  NURSE: NURSE_PERMISSIONS,
  DOCTOR: DOCTOR_PERMISSIONS,
};

// Landing route for each role after login and for role dispatch.
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  RECEPTIONIST: "/reception",
  NURSE: "/nurse",
  DOCTOR: "/doctor",
};

export function normalizeRole(role: string | null | undefined): string {
  return (role ?? "").trim().toUpperCase();
}

export function isRole(role: string | null | undefined): role is Role {
  return (ROLES as readonly string[]).includes(normalizeRole(role));
}

export function toRole(role: string | null | undefined): Role | null {
  const normalized = normalizeRole(role);
  return isRole(normalized) ? (normalized as Role) : null;
}

export function permissionsFor(role: string | null | undefined): Permission[] {
  const r = toRole(role);
  return r ? ROLE_PERMISSIONS[r] : [];
}

export function can(role: string | null | undefined, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}

export function homeFor(role: string | null | undefined): string {
  const r = toRole(role);
  return r ? ROLE_HOME[r] : "/login";
}

// Map an SMS reminder type to the permission required to create/send it.
// Reminder types come from lib/sms.ts ReminderType.
export const REMINDER_TYPE_PERMISSION: Record<string, Permission> = {
  APPOINTMENT_REMINDER: "appointment.reminders.send",
  MEDICATION_REMINDER: "medication.reminders.create",
  FOLLOW_UP_REMINDER: "followup.reminders.create",
  VACCINATION_REMINDER: "vaccination.reminders.create",
  ANTENATAL_REMINDER: "antenatal.reminders.create",
  LABORATORY_TEST_REMINDER: "laboratory.reminders.create",
};

export function canSendReminderType(
  role: string | null | undefined,
  reminderType: string
): boolean {
  const required = REMINDER_TYPE_PERMISSION[reminderType];
  // Unknown reminder types are denied by default (fail closed).
  if (!required) return false;
  return can(role, required);
}

// Prefix-based mapping used by the middleware to protect page routes by the
// permission a role needs to view that area. The first matching prefix wins.
export const ROUTE_PERMISSION: { prefix: string; permission: Permission }[] = [
  { prefix: "/users", permission: "users.manage" },
  { prefix: "/departments", permission: "departments.manage" },
  { prefix: "/settings", permission: "settings.manage" },
  { prefix: "/reports", permission: "reports.view" },
  { prefix: "/admin", permission: "users.manage" },
  { prefix: "/reception", permission: "appointments.manage" },
  { prefix: "/nurse", permission: "queue.manage" },
  { prefix: "/doctor", permission: "consultation.manage" },
  { prefix: "/patients", permission: "patients.read" },
  { prefix: "/appointments", permission: "appointments.read" },
  { prefix: "/sms", permission: "sms.history.read" },
];

export function requiredPermissionForPath(pathname: string): Permission | null {
  const match = ROUTE_PERMISSION.find((r) => pathname.startsWith(r.prefix));
  return match ? match.permission : null;
}

// Department-scoped roles only see patients/appointments in their own
// department. Admin sees everything; receptionists register/book across the
// whole hospital, so they are not department-restricted.
export function isDepartmentScoped(role: string | null | undefined): boolean {
  const r = toRole(role);
  return r === "NURSE" || r === "DOCTOR";
}
