import { prisma } from "@/lib/prisma";
import { getSession, requireAuth } from "@/lib/auth";
import { RoleDashboard, type QuickAction } from "@/components/dashboard/RoleDashboard";

export const dynamic = "force-dynamic";

const ICONS: Record<string, React.ReactNode> = {
  users: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  settings: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  reports: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  patients: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
};

const ACTIONS: QuickAction[] = [
  { label: "Manage Users", description: "Create, edit and remove staff accounts", href: "/users", icon: ICONS.users },
  { label: "System Settings", description: "Facility and SMS configuration", href: "/settings", icon: ICONS.settings },
  { label: "Reports & Analytics", description: "Full facility reports", href: "/reports", icon: ICONS.reports },
  { label: "Patient Records", description: "Browse all patients", href: "/patients", icon: ICONS.patients },
];

export default async function AdminDashboardPage() {
  await requireAuth(["ADMIN"]);
  const session = await getSession();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fall back to zeros if the database is unavailable (e.g. UI-review preview
  // deployments that run without a provisioned database).
  const [totalPatients, totalUsers, smsSentToday, appointments] = await Promise.all([
    prisma.patient.count().catch(() => 0),
    prisma.user.count().catch(() => 0),
    prisma.sMSLog.count({ where: { sentAt: { gte: today } } }).catch(() => 0),
    prisma.appointment.count().catch(() => 0),
  ]);

  const stats = [
    { label: "Total Patients", value: totalPatients, hint: "Registered patients" },
    { label: "Staff Accounts", value: totalUsers, hint: "System users" },
    { label: "Appointments", value: appointments, hint: "All-time" },
    { label: "SMS Sent Today", value: smsSentToday, hint: "Reminders dispatched" },
  ];

  return (
    <RoleDashboard
      role="ADMIN"
      name={session?.name}
      title="Administration"
      subtitle="Manage users, settings and view facility-wide analytics."
      actions={ACTIONS}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 sm:p-5">
            <p className="text-xs font-semibold text-slate-500">{s.label}</p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="mt-1 text-sm text-slate-500">{s.hint}</p>
          </div>
        ))}
      </div>
    </RoleDashboard>
  );
}
