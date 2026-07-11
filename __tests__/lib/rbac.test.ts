import {
  ROLES,
  can,
  canSendReminderType,
  homeFor,
  isRole,
  normalizeRole,
  permissionsFor,
  requiredPermissionForPath,
  toRole,
  type Permission,
} from "@/lib/rbac";

describe("normalizeRole / isRole / toRole", () => {
  it("uppercases and trims", () => {
    expect(normalizeRole("  admin ")).toBe("ADMIN");
    expect(normalizeRole(null)).toBe("");
    expect(normalizeRole(undefined)).toBe("");
  });

  it("recognizes only the four canonical roles", () => {
    for (const r of ROLES) expect(isRole(r)).toBe(true);
    expect(isRole("nurse")).toBe(true);
    expect(isRole("SUPERUSER")).toBe(false);
    expect(isRole("")).toBe(false);
  });

  it("toRole returns null for unknown roles", () => {
    expect(toRole("doctor")).toBe("DOCTOR");
    expect(toRole("ghost")).toBeNull();
  });
});

describe("permission matrix", () => {
  it("ADMIN has every permission the other roles have", () => {
    const others = new Set<Permission>([
      ...permissionsFor("RECEPTIONIST"),
      ...permissionsFor("NURSE"),
      ...permissionsFor("DOCTOR"),
    ]);
    for (const p of others) expect(can("ADMIN", p)).toBe(true);
    // admin-only powers
    expect(can("ADMIN", "users.manage")).toBe(true);
    expect(can("ADMIN", "settings.manage")).toBe(true);
    expect(can("ADMIN", "reports.view")).toBe(true);
    expect(can("ADMIN", "sms.manage")).toBe(true);
    expect(can("ADMIN", "patients.delete")).toBe(true);
  });

  it("RECEPTIONIST can manage patients/appointments but not clinical or admin scopes", () => {
    expect(can("RECEPTIONIST", "patients.create")).toBe(true);
    expect(can("RECEPTIONIST", "appointments.manage")).toBe(true);
    expect(can("RECEPTIONIST", "appointment.reminders.send")).toBe(true);
    expect(can("RECEPTIONIST", "users.manage")).toBe(false);
    expect(can("RECEPTIONIST", "reports.view")).toBe(false);
    expect(can("RECEPTIONIST", "vitals.record")).toBe(false);
    expect(can("RECEPTIONIST", "consultation.manage")).toBe(false);
  });

  it("NURSE can record vitals/queue and clinical reminders but not admin/consultation", () => {
    expect(can("NURSE", "vitals.record")).toBe(true);
    expect(can("NURSE", "queue.manage")).toBe(true);
    expect(can("NURSE", "medication.reminders.create")).toBe(true);
    expect(can("NURSE", "users.manage")).toBe(false);
    expect(can("NURSE", "settings.manage")).toBe(false);
    expect(can("NURSE", "consultation.manage")).toBe(false);
    expect(can("NURSE", "patients.create")).toBe(false);
  });

  it("DOCTOR can manage consultations/diagnosis but not admin/vitals.record", () => {
    expect(can("DOCTOR", "consultation.manage")).toBe(true);
    expect(can("DOCTOR", "diagnosis.write")).toBe(true);
    expect(can("DOCTOR", "treatment.write")).toBe(true);
    expect(can("DOCTOR", "laboratory.reminders.create")).toBe(true);
    expect(can("DOCTOR", "users.manage")).toBe(false);
    expect(can("DOCTOR", "vitals.record")).toBe(false);
    expect(can("DOCTOR", "patients.create")).toBe(false);
  });

  it("fails closed for unknown roles", () => {
    expect(can("HACKER", "patients.read")).toBe(false);
    expect(can("", "patients.read")).toBe(false);
    expect(permissionsFor("HACKER")).toEqual([]);
  });
});

describe("canSendReminderType", () => {
  it("RECEPTIONIST can only send appointment reminders", () => {
    expect(canSendReminderType("RECEPTIONIST", "APPOINTMENT_REMINDER")).toBe(true);
    expect(canSendReminderType("RECEPTIONIST", "MEDICATION_REMINDER")).toBe(false);
    expect(canSendReminderType("RECEPTIONIST", "LABORATORY_TEST_REMINDER")).toBe(false);
  });

  it("NURSE can send medication/follow-up/vaccination reminders", () => {
    expect(canSendReminderType("NURSE", "MEDICATION_REMINDER")).toBe(true);
    expect(canSendReminderType("NURSE", "FOLLOW_UP_REMINDER")).toBe(true);
    expect(canSendReminderType("NURSE", "VACCINATION_REMINDER")).toBe(true);
    expect(canSendReminderType("NURSE", "LABORATORY_TEST_REMINDER")).toBe(false);
    expect(canSendReminderType("NURSE", "APPOINTMENT_REMINDER")).toBe(false);
  });

  it("DOCTOR can send laboratory/medication/follow-up reminders", () => {
    expect(canSendReminderType("DOCTOR", "LABORATORY_TEST_REMINDER")).toBe(true);
    expect(canSendReminderType("DOCTOR", "MEDICATION_REMINDER")).toBe(true);
    expect(canSendReminderType("DOCTOR", "FOLLOW_UP_REMINDER")).toBe(true);
    expect(canSendReminderType("DOCTOR", "APPOINTMENT_REMINDER")).toBe(false);
    expect(canSendReminderType("DOCTOR", "VACCINATION_REMINDER")).toBe(false);
  });

  it("ADMIN can send every known reminder type", () => {
    for (const t of [
      "APPOINTMENT_REMINDER",
      "MEDICATION_REMINDER",
      "VACCINATION_REMINDER",
      "ANTENATAL_REMINDER",
      "FOLLOW_UP_REMINDER",
      "LABORATORY_TEST_REMINDER",
    ]) {
      expect(canSendReminderType("ADMIN", t)).toBe(true);
    }
  });

  it("fails closed for unknown reminder types", () => {
    expect(canSendReminderType("ADMIN", "MYSTERY_REMINDER")).toBe(false);
    expect(canSendReminderType("NURSE", "")).toBe(false);
  });
});

describe("homeFor", () => {
  it("maps each role to its dashboard", () => {
    expect(homeFor("ADMIN")).toBe("/admin");
    expect(homeFor("RECEPTIONIST")).toBe("/reception");
    expect(homeFor("NURSE")).toBe("/nurse");
    expect(homeFor("DOCTOR")).toBe("/doctor");
  });

  it("sends unknown roles to /login", () => {
    expect(homeFor("ghost")).toBe("/login");
    expect(homeFor(null)).toBe("/login");
  });
});

describe("requiredPermissionForPath", () => {
  it("maps protected areas to permissions", () => {
    expect(requiredPermissionForPath("/users")).toBe("users.manage");
    expect(requiredPermissionForPath("/departments")).toBe("departments.manage");
    expect(requiredPermissionForPath("/settings")).toBe("settings.manage");
    expect(requiredPermissionForPath("/reports")).toBe("reports.view");
    expect(requiredPermissionForPath("/admin")).toBe("users.manage");
    expect(requiredPermissionForPath("/reception")).toBe("appointments.manage");
    expect(requiredPermissionForPath("/nurse")).toBe("queue.manage");
    expect(requiredPermissionForPath("/doctor")).toBe("consultation.manage");
  });

  it("protects the shared clinical module routes", () => {
    expect(requiredPermissionForPath("/patients")).toBe("patients.read");
    expect(requiredPermissionForPath("/appointments")).toBe("appointments.read");
    expect(requiredPermissionForPath("/sms")).toBe("sms.history.read");
  });

  it("returns null for unprotected paths", () => {
    expect(requiredPermissionForPath("/profile")).toBeNull();
    expect(requiredPermissionForPath("/")).toBeNull();
  });

  it("blocks cross-role direct URL access via can()", () => {
    // A nurse trying to open /admin must be denied.
    const adminPerm = requiredPermissionForPath("/admin")!;
    expect(can("NURSE", adminPerm)).toBe(false);
    // A receptionist trying to open /doctor must be denied.
    const doctorPerm = requiredPermissionForPath("/doctor")!;
    expect(can("RECEPTIONIST", doctorPerm)).toBe(false);
  });
});
