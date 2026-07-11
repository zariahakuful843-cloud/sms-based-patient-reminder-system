import { getSession, requireAuth } from "@/lib/auth";
import { RoleDashboard, type QuickAction } from "@/components/dashboard/RoleDashboard";
import { DashboardStats } from "@/components/dashboard/DashboardStats";

export const dynamic = "force-dynamic";

const ICONS: Record<string, React.ReactNode> = {
  patients: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  sms: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  calendar: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

const ACTIONS: QuickAction[] = [
  { label: "View Queue", description: "Manage today's patient queue", href: "/appointments", icon: ICONS.calendar },
  { label: "Record Vitals", description: "Coming soon", href: "/patients", icon: ICONS.patients },
  { label: "Send Medication Reminder", description: "Send medication SMS", href: "/sms", icon: ICONS.sms },
];

export default async function NurseDashboardPage() {
  await requireAuth(["NURSE", "ADMIN"]);
  const session = await getSession();

  return (
    <RoleDashboard
      role="NURSE"
      name={session?.name}
      title="Nurse Station"
      subtitle="Manage the patient queue, record vitals and send clinical reminders."
      actions={ACTIONS}
    >
      <DashboardStats />
    </RoleDashboard>
  );
}
