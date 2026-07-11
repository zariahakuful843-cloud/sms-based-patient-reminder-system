import {
  formatToInternational,
  buildReminderMessageByType,
  sendSMS,
  type ReminderType,
} from "@/lib/sms";

describe("formatToInternational", () => {
  it("converts a local 0-prefixed 10-digit number to Ghana international format", () => {
    expect(formatToInternational("0241234567")).toBe("233241234567");
  });

  it("strips a leading plus sign", () => {
    expect(formatToInternational("+233241234567")).toBe("233241234567");
  });

  it("removes spaces, dashes and parentheses", () => {
    expect(formatToInternational("+233 (24) 123-4567")).toBe("233241234567");
  });

  it("leaves an already-international number unchanged", () => {
    expect(formatToInternational("233241234567")).toBe("233241234567");
  });

  it("does not prepend the country code when the 0-prefixed number is not 10 digits", () => {
    expect(formatToInternational("024123456")).toBe("024123456");
  });

  it("returns an empty string for empty input", () => {
    expect(formatToInternational("")).toBe("");
  });

  it("treats null/undefined input as an empty string", () => {
    // @ts-expect-error exercising defensive nullish handling
    expect(formatToInternational(undefined)).toBe("");
    // @ts-expect-error exercising defensive nullish handling
    expect(formatToInternational(null)).toBe("");
  });
});

describe("buildReminderMessageByType", () => {
  const patientName = "Ama Mensah";

  it("builds an appointment reminder that mentions arriving early", () => {
    const msg = buildReminderMessageByType({
      reminderType: "APPOINTMENT_REMINDER",
      patientName,
      appointmentDate: new Date("2024-03-05T10:00:00Z"),
    });
    expect(msg).toContain(patientName);
    expect(msg).toContain("appointment on");
    expect(msg).toContain("arrive 15 minutes early");
  });

  it("builds a medication reminder with the provided medication name", () => {
    const msg = buildReminderMessageByType({
      reminderType: "MEDICATION_REMINDER",
      patientName,
      medicationName: "Paracetamol",
    });
    expect(msg).toContain("Paracetamol");
  });

  it("uses a default medication phrase when no medication name is given", () => {
    const msg = buildReminderMessageByType({
      reminderType: "MEDICATION_REMINDER",
      patientName,
    });
    expect(msg).toContain("your medication");
  });

  it("builds a vaccination reminder", () => {
    const msg = buildReminderMessageByType({
      reminderType: "VACCINATION_REMINDER",
      patientName,
      vaccinationDate: new Date("2024-03-05T10:00:00Z"),
    });
    expect(msg).toContain("vaccination is scheduled");
  });

  it("builds an antenatal reminder", () => {
    const msg = buildReminderMessageByType({
      reminderType: "ANTENATAL_REMINDER",
      patientName,
      antenatalDate: new Date("2024-03-05T10:00:00Z"),
    });
    expect(msg).toContain("antenatal visit");
  });

  it("builds a follow-up reminder", () => {
    const msg = buildReminderMessageByType({
      reminderType: "FOLLOW_UP_REMINDER",
      patientName,
      followUpDate: new Date("2024-03-05T10:00:00Z"),
    });
    expect(msg).toContain("follow-up visit");
  });

  it("builds a laboratory test reminder", () => {
    const msg = buildReminderMessageByType({
      reminderType: "LABORATORY_TEST_REMINDER",
      patientName,
      laboratoryTestDate: new Date("2024-03-05T10:00:00Z"),
    });
    expect(msg).toContain("laboratory test is scheduled");
  });

  it("returns a generic reminder for an unknown reminder type", () => {
    const msg = buildReminderMessageByType({
      reminderType: "SOMETHING_ELSE" as ReminderType,
      patientName,
    });
    expect(msg).toBe(`Dear ${patientName}, this is a reminder.`);
  });

  it("does not throw when a type-specific date is omitted", () => {
    expect(() =>
      buildReminderMessageByType({
        reminderType: "APPOINTMENT_REMINDER",
        patientName,
      })
    ).not.toThrow();
  });
});

describe("sendSMS", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.ARKESEL_API_KEY;
    delete process.env.ARKESEL_SMS_URL;
    delete process.env.ARKESEL_SENDER_ID;
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("returns a SIMULATED result and does not call fetch when no API key is set", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await sendSMS({ to: "0241234567", message: "hi" });

    expect(result.success).toBe(true);
    expect(result.status).toBe("SIMULATED");
    expect(result.messageId).toMatch(/^SIM-/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns SENT and forwards the formatted recipient on a successful API response", async () => {
    process.env.ARKESEL_API_KEY = "test-key";
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success", data: [{ id: "msg-123" }] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await sendSMS({ to: "0241234567", message: "hi" });

    expect(result).toEqual({ success: true, messageId: "msg-123", status: "SENT" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.recipients).toEqual(["233241234567"]);
    expect(body.sender).toBe("SMSReminder");
  });

  it("uses an explicit senderId over the default when provided", async () => {
    process.env.ARKESEL_API_KEY = "test-key";
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success", data: [{ id: "msg-1" }] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await sendSMS({ to: "0241234567", message: "hi", senderId: "Clinic" });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.sender).toBe("Clinic");
  });

  it("returns FAILED with the API error message when the API reports failure", async () => {
    process.env.ARKESEL_API_KEY = "test-key";
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "error", message: "insufficient balance" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await sendSMS({ to: "0241234567", message: "hi" });

    expect(result.success).toBe(false);
    expect(result.status).toBe("FAILED");
    expect(result.error).toBe("insufficient balance");
  });

  it("returns FAILED with the thrown error message on a network error", async () => {
    process.env.ARKESEL_API_KEY = "test-key";
    const fetchMock = jest.fn().mockRejectedValue(new Error("boom"));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await sendSMS({ to: "0241234567", message: "hi" });

    expect(result).toEqual({ success: false, error: "boom", status: "FAILED" });
  });
});
