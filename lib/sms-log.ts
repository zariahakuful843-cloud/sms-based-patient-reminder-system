import { prisma } from "@/lib/prisma";
import { sendSMS, type SMSResult } from "@/lib/sms";

/** Maps an SMS provider result to the status persisted on an SMSLog row. */
export function resolveLogStatus(result: SMSResult): "SENT" | "FAILED" {
  return result.status === "FAILED" ? "FAILED" : "SENT";
}

/**
 * Persists a PENDING SMSLog, sends the SMS, then updates the log with the
 * resulting status. Consolidates the create-send-update flow duplicated across
 * the single/bulk/test SMS routes.
 */
export async function sendAndLogSMS(input: {
  patientId: number;
  patientName: string;
  phoneNumber: string;
  reminderType: string;
  message: string;
}): Promise<{ log: Awaited<ReturnType<typeof prisma.sMSLog.update>>; smsResult: SMSResult }> {
  const pending = await prisma.sMSLog.create({
    data: { ...input, status: "PENDING" },
  });

  const smsResult = await sendSMS({ to: input.phoneNumber, message: input.message });

  const log = await prisma.sMSLog.update({
    where: { id: pending.id },
    data: { status: resolveLogStatus(smsResult) },
  });

  return { log, smsResult };
}
