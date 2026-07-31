import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileShell } from "@/components/layout/MobileShell";
import type { ReactNode } from "react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const dateLabel = new Date().toLocaleDateString("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <MobileShell
      sidebar={<Sidebar role={session.role} />}
      greeting={getGreeting()}
      name={session.name}
      role={session.role}
      dateLabel={dateLabel}
    >
      {children}
    </MobileShell>
  );
}
