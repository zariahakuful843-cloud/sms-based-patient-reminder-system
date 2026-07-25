import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS, formatToInternational } from "@/lib/sms";

// This route is triggered by Vercel Cron (see vercel.json).
// It finds due scheduled reminders, sends them via Arkesel, and logs the result.
export async function GET(req: NextRequest) {
  // Protect the endpoint so only Vercel's cron (or someone with the secret) can trigger it.
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const dueReminders = await prisma.scheduledReminder.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: now },
      },
    });

    if (dueReminders.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: "No due reminders." });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const reminder of dueReminders) {
      const formattedPhone = formatToInternational(reminder.phoneNumber);
      const result = await sendSMS({ to: formattedPhone, message: reminder.message });
      const deliverySuccess = result.status !== "FAILED";

      await prisma.sMSLog.create({
        data: {
          patientId: reminder.patientId,
          patientName: reminder.patientName,
          phoneNumber: reminder.phoneNumber,
          reminderType: reminder.reminderType,
          message: reminder.message,
          status: deliverySuccess ? "SENT" : "FAILED",
        },
      });

      await prisma.scheduledReminder.update({
        where: { id: reminder.id },
        data: {
          status: deliverySuccess ? "SENT" : "FAILED",
          sentAt: now,
        },
      });

      // If this reminder belongs to an appointment and actually sent, mark it Reminder: Sent.
      if (reminder.appointmentId && deliverySuccess) {
        await prisma.appointment.update({
          where: { id: reminder.appointmentId },
          data: { reminderSent: true },
        }).catch(() => {}); // appointment may have been deleted; safe to ignore
      }

      if (deliverySuccess) sentCount++;
      else failedCount++;
    }

    return NextResponse.json({
      success: true,
      processed: dueReminders.length,
      sent: sentCount,
      failed: failedCount,
    });
  } catch (error: any) {
    console.error("[CRON SEND-SCHEDULED ERROR]:", error.message);
    return NextResponse.json({ error: "Internal Server Processing Error." }, { status: 500 });
  }
}
