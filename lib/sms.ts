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

export async function sendSMS(payload: SMSPayload): Promise<SMSResult> {
  const apiKey = process.env.ARKESEL_API_KEY;
  const senderId = payload.senderId ?? process.env.SMS_SENDER_ID ?? "HealthFac";

  if (!apiKey) {
    // Simulation mode when no API key is configured
    console.log(`[SMS SIMULATED] To: ${payload.to} | Msg: ${payload.message}`);
    return {
      success: true,
      messageId: `SIM-${Date.now()}`,
      status: "SIMULATED",
    };
  }

  try {
    const res = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: senderId,
        message: payload.message,
        recipients: [payload.to],
      }),
    });

    const data = await res.json();

    if (res.ok && data.status === "success") {
      return { success: true, messageId: data.data?.[0]?.id, status: "SENT" };
    }
    return { success: false, error: data.message ?? "Unknown error", status: "FAILED" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { success: false, error: message, status: "FAILED" };
  }
}

export function buildReminderMessage(params: {
  patientName: string;
  facilityName: string;
  appointmentDate: Date;
  doctorName: string;
}): string {
  const date = params.appointmentDate.toLocaleDateString("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = params.appointmentDate.toLocaleTimeString("en-GH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return (
    `Dear ${params.patientName}, this is a reminder of your appointment ` +
    `with ${params.doctorName} at ${params.facilityName} on ${date} at ${time}. ` +
    `Please arrive 15 minutes early. Reply STOP to opt out.`
  );
}
