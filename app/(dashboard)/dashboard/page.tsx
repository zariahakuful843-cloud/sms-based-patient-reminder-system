import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession, requireAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireAuth(["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"]);

  const session = await getSession();
  const role = (session?.role ?? "").trim().toUpperCase();

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
    prisma.scheduledReminder.count({
      where: { status: "PENDING" },
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

  const isAdmin = role === "ADMIN";
  const isReceptionist = role === "RECEPTIONIST";
  const isNurse = role === "NURSE";
  const isDoctor = role === "DOCTOR";

  const formatDoctorName = (doctorName: string) => {
    const dn = (doctorName ?? "").trim();
    const nameWithoutPrefix = dn.replace(/^\s*dr\.\s*/i, "");
    return `Dr. ${nameWithoutPrefix}`.trim();
  };

  // Cards visibility (only what exists in existing queries)
  const allowTotalPatients = isAdmin;
  const allowAppointmentsToday = true;
  const allowPendingSms = isReceptionist || isNurse;
  const allowSmsSentToday = isAdmin;

  // Sections/cards per role matrix
  const showRecentPatients = isAdmin || isReceptionist;
  const showRecentAppointments = isAdmin || isReceptionist;
  const showTodayAppointmentsSection = isNurse || isDoctor;
  const showSmsActivitySection = isAdmin;

  // Quick actions per role matrix
  const quickActions = (() => {
    const items: Array<{ label: string; href: string; icon: React.ReactNode }> = [];

    if (isAdmin) {
      items.push(
        {
          label: "Register Patient",
          href: "/patients/new",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          ),
        },
        {
          label: "New Appointment",
          href: "/appointments/new",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
              />
            </svg>
          ),
        },
        {
          label: "Send SMS",
          href: "/sms",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-4l-2 2H2l2-2 2-2h4l2-2h4l2 2z" />
            </svg>
          ),
        },
        {
          label: "View Reports",
          href: "/reports",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 19V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
            </svg>
          ),
        }
      );
    }

    if (isReceptionist) {
      items.push(
        {
          label: "Register Patient",
          href: "/patients/new",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          ),
        },
        {
          label: "New Appointment",
          href: "/appointments/new",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
              />
            </svg>
          ),
        },
        {
          label: "Send SMS",
          href: "/sms",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-4l-2 2H2l2-2 2-2h4l2-2h4l2 2z" />
            </svg>
          ),
        }
      );
    }

    if (isNurse) {
      items.push(
        {
          label: "View Patients",
          href: "/patients",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          label: "View Appointments",
          href: "/appointments",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          ),
        }
      );
    }

    if (isDoctor) {
      items.push(
        {
          label: "View Patients",
          href: "/patients",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          label: "View Appointments",
          href: "/appointments",
          icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          ),
        }
      );
    }

    return items;
  })();

  return (
    <div className="space-y-6">
      {/* Page intro */}
      <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-blue-700">
              {new Date().toLocaleDateString("en-GH", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="mt-1 text-lg sm:text-xl font-bold text-slate-900">
              Good {getGreeting()}, {session?.name?.split(" ")[0] ?? "Staff"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening at your facility today.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-slate-600">Logged in</p>
              <p className="text-sm font-semibold text-slate-900">{session?.name ?? "—"}</p>
              <p className="text-xs text-slate-500">{session?.role ?? "—"}</p>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {allowTotalPatients && (
          <div className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Patients</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{totalPatients}</p>
                <p className="mt-1 text-sm text-slate-500">Registered patients</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 group-hover:bg-blue-100 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.12-1.283.356-1.857"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {allowAppointmentsToday && (
          <div className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">Today&apos;s Appointments</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{appointmentsToday}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {today.toLocaleDateString("en-GH", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700 ring-1 ring-green-100 group-hover:bg-green-100 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {allowPendingSms && (
          <div className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">Pending Appointments</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{pendingReminders}</p>
                <p className="mt-1 text-sm text-slate-500">SMS not yet sent</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 group-hover:bg-emerald-100 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159L5 17h10"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {allowSmsSentToday && (
          <div className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">SMS Sent Today</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{smsSentToday}</p>
                <p className="mt-1 text-sm text-slate-500">Reminders dispatched</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 group-hover:bg-blue-100 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">Quick Actions</h2>
            <p className="text-xs text-slate-500">Common tasks for faster workflow</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold ring-1 ring-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Ready
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          {quickActions.map(({ label, href, icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 group-hover:bg-blue-100 transition-colors">
                  {icon}
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-900">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {(showRecentAppointments || showRecentPatients) && isAdmin && (
          <>
            {showRecentPatients && (
              <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Recent Patients</h2>
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
            )}

            {showRecentAppointments && (
              <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Recent Appointments</h2>
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
                          <div className="hidden sm:block text-xs text-slate-600">{formatDoctorName(appt.doctorName)}</div>
                          <div className="sm:hidden text-xs text-slate-500">{formatDoctorName(appt.doctorName)}</div>
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
            )}

            {showSmsActivitySection && (
              <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">SMS Activity</h2>
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
                    <p className="mt-1 text-sm text-slate-500">Recipient + delivery rows are shown in the SMS page.</p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* RECEPTIONIST: Today's Appointments + Recent Patients */}
        {isReceptionist && (
          <>
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
                        <div className="hidden sm:block text-xs text-slate-600">{formatDoctorName(appt.doctorName)}</div>
                        <div className="sm:hidden text-xs text-slate-500">{formatDoctorName(appt.doctorName)}</div>
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

            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Recent Patients</h2>
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
          </>
        )}

        {/* NURSE & DOCTOR: Today&apos;s Appointments only */}
        {(isNurse || isDoctor) && (
          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden lg:col-span-2">
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
                      <div className="hidden sm:block text-xs text-slate-600">{formatDoctorName(appt.doctorName)}</div>
                      <div className="sm:hidden text-xs text-slate-500">{formatDoctorName(appt.doctorName)}</div>
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
        )}
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

