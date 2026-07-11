import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Card = { label: string; value: number | string; hint?: string };
type Activity = { label: string; detail?: string; when?: string };

function dayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = toRole(session.role);
  const { start, end } = dayRange();
  const today = { gte: start, lt: end };
  const deptId = session.departmentId ?? null;

  const cards: Card[] = [];
  const recent: Activity[] = [];

  try {
  if (role === "ADMIN") {
    const [users, patients, appointments, smsToday, activeDepts, consultationsToday, newUsers, recentSms, recentPatients] =
      await Promise.all([
        prisma.user.count(),
        prisma.patient.count(),
        prisma.appointment.count(),
        prisma.sMSLog.count({ where: { sentAt: today } }),
        prisma.department.count({ where: { active: true } }),
        prisma.appointment.count({ where: { queueStatus: "CONSULTATION_COMPLETED", updatedAt: today } }),
        prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { name: true, role: true, createdAt: true } }),
        prisma.sMSLog.findMany({ orderBy: { sentAt: "desc" }, take: 5, select: { patientName: true, reminderType: true, sentAt: true } }),
        prisma.patient.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { fullName: true, createdAt: true } }),
      ]);
    cards.push(
      { label: "Total Users", value: users },
      { label: "Total Patients", value: patients },
      { label: "Total Appointments", value: appointments },
      { label: "SMS Sent Today", value: smsToday },
      { label: "Active Departments", value: activeDepts },
      { label: "Consultations Today", value: consultationsToday }
    );
    newUsers.forEach((u) => recent.push({ label: `New user: ${u.name}`, detail: u.role, when: u.createdAt.toISOString() }));
    recentSms.forEach((s) => recent.push({ label: `SMS to ${s.patientName}`, detail: s.reminderType, when: s.sentAt.toISOString() }));
    recentPatients.forEach((p) => recent.push({ label: `Registered: ${p.fullName}`, when: p.createdAt.toISOString() }));
  } else if (role === "RECEPTIONIST") {
    const [patients, todayAppts, upcoming, reminders, newPatients, upcomingList] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count({ where: { appointmentDate: today } }),
      prisma.appointment.count({ where: { appointmentDate: { gte: end }, status: "SCHEDULED" } }),
      prisma.sMSLog.count({ where: { reminderType: "APPOINTMENT_REMINDER", sentAt: today } }),
      prisma.patient.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { fullName: true, createdAt: true } }),
      prisma.appointment.findMany({
        where: { appointmentDate: { gte: start } },
        orderBy: { appointmentDate: "asc" },
        take: 5,
        include: { patient: { select: { fullName: true } }, department: { select: { name: true } } },
      }),
    ]);
    cards.push(
      { label: "Total Patients", value: patients },
      { label: "Today's Appointments", value: todayAppts },
      { label: "Upcoming Appointments", value: upcoming },
      { label: "Appointment Reminders", value: reminders, hint: "sent today" }
    );
    newPatients.forEach((p) => recent.push({ label: `Registered: ${p.fullName}`, when: p.createdAt.toISOString() }));
    upcomingList.forEach((a) =>
      recent.push({
        label: `${a.patient.fullName}`,
        detail: a.department?.name ?? "—",
        when: a.appointmentDate.toISOString(),
      })
    );
  } else if (role === "NURSE") {
    const scope = deptId ? { departmentId: deptId } : {};
    const [waiting, todayQueue, medication, followup, waitingList, readyList] = await Promise.all([
      prisma.appointment.count({ where: { ...scope, appointmentDate: today, queueStatus: "WAITING" } }),
      prisma.appointment.count({ where: { ...scope, appointmentDate: today } }),
      prisma.sMSLog.count({ where: { reminderType: "MEDICATION_REMINDER", sentAt: today } }),
      prisma.sMSLog.count({ where: { reminderType: "FOLLOW_UP_REMINDER", sentAt: today } }),
      prisma.appointment.findMany({
        where: { ...scope, appointmentDate: today, queueStatus: "WAITING" },
        orderBy: { appointmentDate: "asc" },
        take: 5,
        include: { patient: { select: { fullName: true } } },
      }),
      prisma.appointment.findMany({
        where: { ...scope, appointmentDate: today, queueStatus: "WAITING_FOR_DOCTOR" },
        orderBy: { appointmentDate: "asc" },
        take: 5,
        include: { patient: { select: { fullName: true } } },
      }),
    ]);
    cards.push(
      { label: "Patients Waiting", value: waiting },
      { label: "Today's Queue", value: todayQueue },
      { label: "Medication Reminders", value: medication, hint: "sent today" },
      { label: "Follow-up Reminders", value: followup, hint: "sent today" }
    );
    waitingList.forEach((a) => recent.push({ label: `Waiting: ${a.patient.fullName}`, when: a.appointmentDate.toISOString() }));
    readyList.forEach((a) => recent.push({ label: `Ready for doctor: ${a.patient.fullName}`, when: a.appointmentDate.toISOString() }));
  } else if (role === "DOCTOR") {
    const scope = deptId ? { departmentId: deptId } : {};
    const [myAppts, waiting, laboratory, followup, completedToday, todayPatients] = await Promise.all([
      prisma.appointment.count({ where: { doctorId: session.userId, appointmentDate: today } }),
      prisma.appointment.count({ where: { ...scope, appointmentDate: today, doctorId: null } }),
      prisma.sMSLog.count({ where: { reminderType: "LABORATORY_TEST_REMINDER", sentAt: today } }),
      prisma.sMSLog.count({ where: { reminderType: "FOLLOW_UP_REMINDER", sentAt: today } }),
      prisma.appointment.count({
        where: { doctorId: session.userId, queueStatus: "CONSULTATION_COMPLETED", updatedAt: today },
      }),
      prisma.appointment.findMany({
        where: { OR: [{ doctorId: session.userId }, { ...scope, doctorId: null }], appointmentDate: today },
        orderBy: { appointmentDate: "asc" },
        take: 5,
        include: { patient: { select: { fullName: true } } },
      }),
    ]);
    cards.push(
      { label: "My Appointments", value: myAppts, hint: "today" },
      { label: "Patients Waiting", value: waiting, hint: "unassigned in dept" },
      { label: "Laboratory Reminders", value: laboratory, hint: "sent today" },
      { label: "Follow-up Reminders", value: followup, hint: "sent today" },
      { label: "Consultations Completed", value: completedToday, hint: "today" }
    );
    todayPatients.forEach((a) => recent.push({ label: a.patient.fullName, when: a.appointmentDate.toISOString() }));
  }
  } catch {
    // Preview/demo deployments run without a database; return empty sections.
    return NextResponse.json({ cards: [], recent: [] });
  }

  return NextResponse.json({ cards, recent });
}
