import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getSmsStats } from "@/lib/smsStats";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(["ADMIN"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const smsStats = await getSmsStats({ from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined });


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
      total: smsStats.total,
      sent: smsStats.sent,
      // treat DELIVERED = SENT per project rule
      delivered: smsStats.delivered,
      pending: smsStats.pendingMessages,

      failed: smsStats.failed,
      byMonth: smsByMonth.map((m) => ({
        month: m.month,
        count: Number(m.count),
      })),
    },
  });
}


