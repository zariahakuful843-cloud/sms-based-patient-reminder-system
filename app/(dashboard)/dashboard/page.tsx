import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalPatients,
    appointmentsToday,
    pendingReminders,
    smsSentToday,
    recentAppointments,
    recentPatients,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.appointment.count({
      where: { appointmentDate: { gte: today, lt: tomorrow } },
    }),
    prisma.appointment.count({
      where: { reminderSent: false, status: "SCHEDULED", appointmentDate: { gte: new Date() } },
    }),
    prisma.sMSLog.count({
      where: { sentAt: { gte: today } },
    }),
    prisma.appointment.findMany({
      take: 5,
      orderBy: { appointmentDate: "asc" },
      where: { appointmentDate: { gte: new Date() }, status: "SCHEDULED" },
      include: { patient: { select: { fullName: true, phoneNumber: true } } },
    }),
    prisma.patient.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          Good {getGreeting()}, {session?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-slate-500">Here&apos;s what&apos;s happening at your facility today.</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Patients"
          value={totalPatients}
          sub="Registered patients"
          color="blue"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Appointments Today"
          value={appointmentsToday}
          sub={today.toLocaleDateString("en-GH", { weekday: "long", day: "numeric", month: "short" })}
          color="emerald"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Pending Reminders"
          value={pendingReminders}
          sub="SMS not yet sent"
          color="amber"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
        <StatCard
          label="SMS Sent Today"
          value={smsSentToday}
          sub="Reminders dispatched"
          color="violet"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
      </div>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Upcoming Appointments</h2>
            <Link href="/appointments" className="text-xs font-medium text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {recentAppointments.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No upcoming appointments.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentAppointments.map((appt) => (
                <li key={appt.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{appt.patient.fullName}</p>
                    <p className="text-xs text-slate-500">Dr. {appt.doctorName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-700">
                      {formatDateTime(appt.appointmentDate)}
                    </p>
                    <Badge status={appt.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recently Registered Patients */}
        <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Recently Registered</h2>
            <Link href="/patients" className="text-xs font-medium text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {recentPatients.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No patients registered yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPatients.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {p.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{p.fullName}</p>
                      <p className="text-xs text-slate-500">{p.phoneNumber}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {p.gender}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Register Patient", href: "/patients/new", color: "blue" },
          { label: "New Appointment", href: "/appointments/new", color: "emerald" },
          { label: "Send SMS", href: "/sms", color: "violet" },
          { label: "View Reports", href: "/reports", color: "amber" },
        ].map(({ label, href, color }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center justify-center rounded-xl py-4 text-sm font-semibold transition-colors ${
              color === "blue"
                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                : color === "emerald"
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : color === "violet"
                ? "bg-violet-50 text-violet-700 hover:bg-violet-100"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
