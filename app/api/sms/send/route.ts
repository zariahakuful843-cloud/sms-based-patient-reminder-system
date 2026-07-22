import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";

// Helper function to format local Ghanaian phone numbers into Arkesel international format
function formatArkeselNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, '').replace('+', '');
  if (cleaned.startsWith('0')) {
    cleaned = '233' + cleaned.substring(1);
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  // 1. Verify User Authorization Rights
  try {
    await requireAuth(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"]);
  } catch (err) {
    console.error("[SMS SEND] forbidden", {
      route: "POST /api/sms/send",
      error: err instanceof Error ? err.message : err,
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { 
      mode,          // "single" or "bulk"
      patientId,     // For single patient
      message,       // The message body text
      reminderType,  // Type label string
      phoneNumber,   // Manual custom phone number input if any
      scheduleTime   // Optional ISO datetime string for future sending
    } = body as {
      mode: "single" | "bulk";
      patientId?: number;
      message: string;
      reminderType?: string;
      phoneNumber?: string;
      scheduleTime?: string;
    };

    if (!message) {
      return NextResponse.json({ error: "Message content is required." }, { status: 400 });
    }

    const typeLabel = reminderType ?? "APPOINTMENT_REMINDER";
    const isScheduled = !!scheduleTime;

    // ==========================================
    // CASE A: RUNNING FUTURE SCHEDULED AUTOMATION
    // ==========================================
    if (isScheduled) {
      const runDate = new Date(scheduleTime);

      if (mode === "single") {
        if (!patientId) return NextResponse.json({ error: "patientId is required for single mode." }, { status: 400 });
        const patient = await prisma.patient.findUnique({ where: { id: Number(patientId) } });
        if (!patient) return NextResponse.json({ error: "Patient not found." }, { status: 404 });

        const targetPhone = phoneNumber ?? patient.phoneNumber;
        const scheduleRecord = await prisma.scheduledReminder.create({
          data: {
            patientId: patient.id,
            patientName: patient.fullName,
            phoneNumber: targetPhone,
            reminderType: typeLabel,
            message,
            status: "PENDING",
            scheduledAt: runDate,
          },
        });
        return NextResponse.json({ success: true, mode: "scheduled-single", data: scheduleRecord }, { status: 201 });
      } else {
        // Bulk Scheduling Action: Pull all patient contacts
        const allPatients = await prisma.patient.findMany({ select: { id: true, fullName: true, phoneNumber: true } });
        
        const schedulePromises = allPatients.map(p => 
          prisma.scheduledReminder.create({
            data: {
              patientId: p.id,
              patientName: p.fullName,
              phoneNumber: p.phoneNumber,
              reminderType: typeLabel,
              message,
              status: "PENDING",
              scheduledAt: runDate,
            }
          })
        );
        await Promise.all(schedulePromises);
        return NextResponse.json({ success: true, mode: "scheduled-bulk", total: allPatients.length }, { status: 201 });
      }
    }

    // ==========================================
    // CASE B: IMMEDIATE LIVE DISPATCH
    // ==========================================
    if (mode === "single") {
      if (!patientId) return NextResponse.json({ error: "patientId is required for single mode." }, { status: 400 });
      const patient = await prisma.patient.findUnique({ where: { id: Number(patientId) } });
      if (!patient) return NextResponse.json({ error: "Patient not found." }, { status: 404 });

      const targetPhone = phoneNumber ?? patient.phoneNumber;
      const optimizedPhone = formatArkeselNumber(targetPhone);

      // Execute external transmission helper
      const result = await sendSMS({ to: optimizedPhone, message });
      const deliverySuccess = result.status !== "FAILED";

      const log = await prisma.sMSLog.create({
        data: {
          patientId: patient.id,
          patientName: patient.fullName,
          phoneNumber: targetPhone,
          reminderType: typeLabel,
          message,
          status: deliverySuccess ? "SENT" : "FAILED",
          errorMessage: deliverySuccess ? null : (result.error ?? "Unknown error"),
        },
      });
      return NextResponse.json({ success: deliverySuccess, log, smsResult: result }, { status: 201 });

    } else {
      // Immediate Bulk Group Broadcasting Action
      const allPatients = await prisma.patient.findMany();
      if (allPatients.length === 0) {
        return NextResponse.json({ error: "No patients found in your database to broadcast to." }, { status: 404 });
      }

      // Loop and dispatch cleanly to all numbers
      const batchLogs = [];
      for (const p of allPatients) {
        const optimizedPhone = formatArkeselNumber(p.phoneNumber);
        const result = await sendSMS({ to: optimizedPhone, message });
        const deliverySuccess = result.status !== "FAILED";

        const log = await prisma.sMSLog.create({
          data: {
            patientId: p.id,
            patientName: p.fullName,
            phoneNumber: p.phoneNumber,
            reminderType: typeLabel,
            message,
            status: deliverySuccess ? "SENT" : "FAILED",
          },
        });
        batchLogs.push(log);
      }

      return NextResponse.json({ success: true, mode: "bulk-immediate", totalSent: batchLogs.length }, { status: 201 });
    }

  } catch (error: any) {
    console.error("[SMS DISPATCH API ERROR]:", error.message);
    return NextResponse.json({ error: "Internal Server Processing Error." }, { status: 500 });
  }
}
