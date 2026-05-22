interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<SMSResult> {
  const clientId = process.env.HUBTEL_CLIENT_ID;
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET;
  const senderId = process.env.HUBTEL_SENDER_ID;

  if (!clientId || !clientSecret || !senderId) {
    console.log(
      `[SMS Mock] To: ${phoneNumber} | Message: ${message.substring(0, 50)}...`
    );
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(
      "https://smsc.hubtel.com/v1/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          From: senderId,
          To: phoneNumber,
          Content: message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return { success: false, error: errorData };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.MessageId || data.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function formatReminderMessage(
  template: string,
  variables: Record<string, string>
): string {
  let message = template;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return message;
}
