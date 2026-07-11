import { getSession, requireAuth } from "@/lib/auth";
import { RoleDashboard, type QuickAction, type UpcomingItem } from "@/components/dashboard/RoleDashboard";

export const dynamic = "force-dynamic";

const ICONS: Record<string, React.ReactNode> = {
  history: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calendar: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  sms: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
};

const ACTIONS: QuickAction[] = [
  { label: "Patient History", description: "Review medical records", href: "/patients", icon: ICONS.history },
  { label: "Appointments", description: "View your appointments", href: "/appointments", icon: ICONS.calendar },
  { label: "Laboratory Reminders", description: "Send lab test SMS", href: "/sms", icon: ICONS.sms },
  { label: "Medication Reminders", description: "Send medication SMS", href: "/sms", icon: ICONS.sms },
  { label: "Follow-up Reminders", description: "Send follow-up SMS", href: "/sms", icon: ICONS.sms },
];

const UPCOMING: UpcomingItem[] = [
  { label: "Consultation", description: "Conduct and record consultations" },
  { label: "Diagnosis", description: "Record diagnosis information" },
  { label: "Treatment Notes", description: "Document treatment plans" },
];

export default async function DoctorDashboardPage() {
  await requireAuth(["DOCTOR", "ADMIN"]);
  const session = await getSession();

  return (
    <RoleDashboard
      role="DOCTOR"
      name={session?.name}
      title="Doctor's Desk"
      subtitle="Review patient history, manage consultations and send clinical reminders."
      actions={ACTIONS}
      upcoming={UPCOMING}
    />
  );
}
