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
      where: {
        reminderSent: false,
        status: "SCHEDULED",
        appointmentDate: { gte: new Date() },
      },
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
    <div className="space-y-6">
      {/* Page intro */}
      <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200 shadow-sm p-5 sm:p-6">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">
          Good {getGreeting()}, {session?.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s what&apos;s happening at your facility today.
        </p>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
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
          sub={today.toLocaleDateString("en-GH", {
            weekday: "long",
            day: "numeric",
            month: "short",
          })}
          color="emerald"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Pending SMS Reminders"
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

      {/* Quick actions */}
      <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200 shadow-sm p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          {[
            {
              label: "Register Patient",
              href: "/patients/new",
              color: "blue",
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              ),
            },
            {
              label: "New Appointment",
              href: "/appointments/new",
              color: "emerald",
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
            },
            {
              label: "Send SMS Reminder",
              href: "/sms",
              color: "violet",
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 20l1.5-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 011.7-5.2A8.38 8.38 0 0112 3a8.5 8.5 0 018.5 8.5z" />
                </svg>
              ),
            },
            {
              label: "View Reports",
              href: "/reports",
              color: "amber",
              icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 19V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
          ].map(({ label, href, color, icon }) => (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-2xl border px-4 py-4 transition-colors shadow-sm bg-white hover:bg-slate-50 ${
                color === "blue"
                  ? "border-blue-100"
                  : color === "emerald"
                  ? "border-emerald-100"
                  : color === "violet"
                  ? "border-violet-100"
                  : "border-amber-100"
              }`}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 ${
                  color === "blue"
                    ? "bg-blue-50 text-[color:var(--hospital-blue)]"
                    : color === "emerald"
                    ? "bg-emerald-50 text-emerald-700"
                    : color === "violet"
                    ? "bg-violet-50 text-violet-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {icon}
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-900">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today&apos;s Appointments */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Appointments</h2>
              <p className="text-xs text-slate-500">Hospital schedule overview</p>
            </div>
            <Link href="/appointments" className="text-xs font-medium text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">No upcoming appointments.</p>
          ) : (
            <div className="p-2 sm:p-3">
              <div className="hidden sm:grid grid-cols-5 gap-2 px-3 py-2 text-[11px] font-semibold text-slate-500">
                <div className="col-span-2">Patient</div>
                <div>Doctor</div>
                <div>Date</div>
                <div className="text-right">Status</div>
              </div>

              <ul className="divide-y divide-slate-100">
                {recentAppointments.map((appt) => (
                  <li
                    key={appt.id}
                    className="grid grid-cols-2 sm:grid-cols-5 sm:items-center gap-x-3 gap-y-2 px-3 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="col-span-1 sm:col-span-2">
                      <p className="text-sm font-semibold text-slate-900">{appt.patient.fullName}</p>
                      <p className="text-xs text-slate-500">{appt.patient.phoneNumber ? `+${appt.patient.phoneNumber}` : ""}</p>
                    </div>
                    <div className="hidden sm:block text-xs text-slate-600">Dr. {appt.doctorName}</div>
                    <div className="sm:hidden text-xs text-slate-500">Dr. {appt.doctorName}</div>
                    <div className="text-xs text-slate-700">{formatDateTime(appt.appointmentDate)}</div>
                    <div className="sm:text-right flex justify-between sm:justify-end">
                      <Badge status={appt.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Recently Registered Patients */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recently Registered Patients</h2>
              <p className="text-xs text-slate-500">Newly added profiles</p>
            </div>
            <Link href="/patients" className="text-xs font-medium text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          {recentPatients.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">No patients registered yet.</p>
          ) : (
            <div className="p-2 sm:p-3">
              <ul className="divide-y divide-slate-100">
                {recentPatients.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-4 px-3 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 text-sm font-bold flex-shrink-0">
                        {p.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{p.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{p.phoneNumber}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-50 ring-1 ring-slate-200 rounded-full px-3 py-1 flex-shrink-0">
                      {p.gender}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Recent SMS Activity */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent SMS Activity</h2>
              <p className="text-xs text-slate-500">Delivery status and timestamps</p>
            </div>
            <Link href="/sms" className="text-xs font-medium text-blue-600 hover:underline">
              Open SMS Logs
            </Link>
          </div>

          <div className="p-5">
            <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">SMS Sent Today</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{smsSentToday}</p>
              <p className="mt-1 text-sm text-slate-500">
                Recipient + delivery rows are shown in the SMS page.
              </p>
            </div>
          </div>
        </section>
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

