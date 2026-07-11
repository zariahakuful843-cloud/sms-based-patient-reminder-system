export type SMSPayload = {
  to: string;
  message: string;
  senderId?: string;
};

export type SMSResult = {
  success: boolean;
  messageId?: string;
  error?: string;
  status: "SENT" | "FAILED" | "SIMULATED";
};

export type ReminderType =
  | "APPOINTMENT_REMINDER"
  | "MEDICATION_REMINDER"
  | "VACCINATION_REMINDER"
  | "ANTENATAL_REMINDER"
  | "FOLLOW_UP_REMINDER"
  | "LABORATORY_TEST_REMINDER";

export function formatToInternational(phoneNumber: string): string {
  // Strip all non-numeric characters except for leading +
  let cleaned = (phoneNumber ?? "").replace(/[^\d+]/g, "");

  // If it has a leading +, remove it
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // If it starts with local leading 0 (e.g. 0241234567) and has length 10
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "233" + cleaned.substring(1);
  }

  return cleaned;
}

export async function sendSMS(payload: SMSPayload): Promise<SMSResult> {
  const apiKey = process.env.ARKESEL_API_KEY;
  const url = process.env.ARKESEL_SMS_URL ?? "https://sms.arkesel.com/api/v2/sms/send";
  const senderId = payload.senderId ?? process.env.ARKESEL_SENDER_ID ?? "SMSReminder";

  const formattedTo = formatToInternational(payload.to);

  if (!apiKey) {
    // Simulation mode when no API key is configured
    console.log(`[SMS SIMULATED] To: ${formattedTo} | Msg: ${payload.message}`);
    return {
      success: true,
      messageId: `SIM-${Date.now()}`,
      status: "SIMULATED",
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: senderId,
        message: payload.message,
        recipients: [formattedTo],
      }),
    });

    // The API is expected to return JSON, but on gateway/5xx errors it may
    // return HTML or an empty body. Parse defensively so a bad payload is
    // reported as a real SMS failure instead of being mislabelled a network
    // error by the catch block below.
    const raw = await res.text();
    let data: { status?: string; message?: string; data?: Array<{ id?: string }> } = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      console.error("[SMS ERROR] Arkesel returned a non-JSON response:", {
        httpStatus: res.status,
        body: raw.slice(0, 500),
      });
      return {
        success: false,
        error: `Unexpected response from SMS provider (HTTP ${res.status}).`,
        status: "FAILED",
      };
    }

    if (res.ok && data.status === "success") {
      return { success: true, messageId: data.data?.[0]?.id, status: "SENT" };
    }
    console.error("[SMS ERROR] Arkesel API failure:", data);
    return {
      success: false,
      error: data.message ?? "Unknown error",
      status: "FAILED",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    console.error("[SMS ERROR] sendSMS catch block:", err);
    return { success: false, error: message, status: "FAILED" };
  }
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function buildReminderMessageByType(params: {
  reminderType: ReminderType;
  patientName: string;
  appointmentDate?: Date;
  vaccinationDate?: Date;
  antenatalDate?: Date;
  followUpDate?: Date;
  laboratoryTestDate?: Date;
  medicationName?: string;
}): string {
  const patientName = params.patientName;

  switch (params.reminderType) {
    case "APPOINTMENT_REMINDER": {
      const date = formatDate(params.appointmentDate ?? new Date());
      const time = formatTime(params.appointmentDate ?? new Date());
      return `Dear ${patientName}, this is a reminder that you have an appointment on ${date} at ${time}. Please arrive 15 minutes early.`;
    }
    case "MEDICATION_REMINDER": {
      const med = params.medicationName ?? "your medication";
      return `Dear ${patientName}, this is a reminder to take your medication: ${med}. Follow your prescribed dosage.`;
    }
    case "VACCINATION_REMINDER": {
      const date = formatDate(params.vaccinationDate ?? new Date());
      return `Dear ${patientName}, your vaccination is scheduled for ${date}. Please visit the facility on time.`;
    }
    case "ANTENATAL_REMINDER": {
      const date = formatDate(params.antenatalDate ?? new Date());
      return `Dear ${patientName}, this is a reminder for your antenatal visit on ${date}. We look forward to seeing you.`;
    }
    case "FOLLOW_UP_REMINDER": {
      const date = formatDate(params.followUpDate ?? new Date());
      return `Dear ${patientName}, this is a reminder for your follow-up visit on ${date}. Please contact the facility if you need to reschedule.`;
    }
    case "LABORATORY_TEST_REMINDER": {
      const date = formatDate(params.laboratoryTestDate ?? new Date());
      return `Dear ${patientName}, your laboratory test is scheduled for ${date}. Please arrive on time and follow any preparation instructions.`;
    }
    default:
      return `Dear ${patientName}, this is a reminder.`;
  }
}

