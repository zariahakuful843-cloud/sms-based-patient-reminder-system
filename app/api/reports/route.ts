import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, authErrorStatus } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("reports.view");
  } catch (err) {
    const status = authErrorStatus(err);
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Forbidden" }, { status });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter =
    from && to
      ? { gte: new Date(from), lte: new Date(to) }
      : undefined;

  const [
    totalPatients,
    patientsThisMonth,
    totalAppointments,
    scheduledAppointments,
    completedAppointments,
    cancelledAppointments,
    missedAppointments,
    totalSMS,
    sentSMS,
    failedSMS,
    patientsByGender,
    appointmentsByStatus,
    appointmentsByMonth,
    smsByMonth,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.patient.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.appointment.count({
      where: dateFilter ? { appointmentDate: dateFilter } : undefined,
    }),
    prisma.appointment.count({
      where: {
        status: "SCHEDULED",
        ...(dateFilter ? { appointmentDate: dateFilter } : {}),
      },
    }),
    prisma.appointment.count({
      where: {
        status: "COMPLETED",
        ...(dateFilter ? { appointmentDate: dateFilter } : {}),
      },
    }),
    prisma.appointment.count({
      where: {
        status: "CANCELLED",
        ...(dateFilter ? { appointmentDate: dateFilter } : {}),
      },
    }),
    prisma.appointment.count({
      where: {
        status: "MISSED",
        ...(dateFilter ? { appointmentDate: dateFilter } : {}),
      },
    }),

    // SMS totals from SMSLog model
    // NOTE: your generated Prisma client appears to expose this as `sMSLog`.
    prisma.sMSLog.count({
      where: dateFilter ? { sentAt: dateFilter } : undefined,
    }),
    prisma.sMSLog.count({
      where: {
        status: "SENT",
        ...(dateFilter ? { sentAt: dateFilter } : {}),
      },
    }),
    prisma.sMSLog.count({
      where: {
        status: "FAILED",
        ...(dateFilter ? { sentAt: dateFilter } : {}),
      },
    }),

    prisma.patient.groupBy({
      by: ["gender"],
      _count: { id: true },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      _count: { id: true },
      where: dateFilter ? { appointmentDate: dateFilter } : undefined,
    }),

    // Last 6 months appointments
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char("appointmentDate", 'YYYY-MM') as month,
             COUNT(*) as count
      FROM "Appointment"
      GROUP BY to_char("appointmentDate", 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
    `,

    // Last 6 months SMS
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char("sentAt", 'YYYY-MM') as month,
             COUNT(*) as count
      FROM "SMSLog"
      GROUP BY to_char("sentAt", 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 6
    `,
  ]);

  return NextResponse.json({
    patients: {
      total: totalPatients,
      thisMonth: patientsThisMonth,
      byGender: patientsByGender.map((g) => ({
        gender: g.gender,
        count: Number(g._count.id),
      })),
    },
    appointments: {
      total: totalAppointments,
      scheduled: scheduledAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
      missed: missedAppointments,
      byStatus: appointmentsByStatus.map((s) => ({
        status: s.status,
        count: Number(s._count.id),
      })),
      byMonth: appointmentsByMonth.map((m) => ({
        month: m.month,
        count: Number(m.count),
      })),
    },
    sms: {
      total: totalSMS,
      sent: sentSMS,
      failed: failedSMS,
      byMonth: smsByMonth.map((m) => ({
        month: m.month,
        count: Number(m.count),
      })),
    },
  });
}

