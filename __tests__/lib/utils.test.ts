import {
  cn,
  formatDate,
  formatDateTime,
  formatTime,
  calculateAge,
  statusColor,
} from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class values with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("returns an empty string when given no arguments", () => {
    expect(cn()).toBe("");
  });

  it("returns an empty string when all values are falsy", () => {
    expect(cn(false, null, undefined, "")).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a Date object as 'day short-month year'", () => {
    expect(formatDate(new Date("2024-03-05T00:00:00Z"))).toBe("5 Mar 2024");
  });

  it("accepts an ISO date string", () => {
    expect(formatDate("2024-12-25T00:00:00Z")).toBe("25 Dec 2024");
  });
});

describe("formatDateTime", () => {
  it("includes date and 12-hour time components", () => {
    const result = formatDateTime(new Date("2024-03-05T13:30:00Z"));
    expect(result).toContain("5 Mar 2024");
    // Time portion is timezone-dependent; assert the 12-hour marker is present.
    expect(result).toMatch(/\b(am|pm|AM|PM)\b/);
  });
});

describe("formatTime", () => {
  it("returns a 12-hour formatted time", () => {
    const result = formatTime(new Date("2024-03-05T13:30:00Z"));
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(am|pm|AM|PM)/);
  });
});

describe("calculateAge", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("computes full years for a birthday earlier in the year", () => {
    expect(calculateAge("2000-01-01")).toBe(24);
  });

  it("does not count the current year when the birthday has not occurred yet", () => {
    expect(calculateAge("2000-12-31")).toBe(23);
  });

  it("counts the year when today is exactly the birthday", () => {
    expect(calculateAge("2000-06-15")).toBe(24);
  });

  it("does not count the year when the birthday is later this month", () => {
    expect(calculateAge("2000-06-16")).toBe(23);
  });

  it("returns 0 for a birthday within the current year", () => {
    expect(calculateAge("2024-01-01")).toBe(0);
  });
});

describe("statusColor", () => {
  it.each([
    ["SCHEDULED", "bg-blue-100 text-blue-700"],
    ["COMPLETED", "bg-emerald-100 text-emerald-700"],
    ["CANCELLED", "bg-red-100 text-red-700"],
    ["MISSED", "bg-amber-100 text-amber-700"],
    ["SENT", "bg-emerald-100 text-emerald-700"],
    ["FAILED", "bg-red-100 text-red-700"],
    ["PENDING", "bg-amber-100 text-amber-700"],
    ["SIMULATED", "bg-purple-100 text-purple-700"],
    ["DELIVERED", "bg-emerald-100 text-emerald-700"],
  ])("maps %s to its color classes", (status, expected) => {
    expect(statusColor(status)).toBe(expected);
  });

  it("falls back to slate classes for an unknown status", () => {
    expect(statusColor("UNKNOWN")).toBe("bg-slate-100 text-slate-700");
  });

  it("falls back to slate classes for an empty string", () => {
    expect(statusColor("")).toBe("bg-slate-100 text-slate-700");
  });
});
