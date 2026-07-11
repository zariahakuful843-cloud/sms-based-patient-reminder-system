import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homeFor } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// Generic entry point: dispatch each user to their role-specific dashboard.
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(homeFor(session.role));
}
