import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import type { ReactNode } from "react";


function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Ensure session is non-null (redirect above)

  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={session.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between bg-white px-4 sm:px-6 border-b border-slate-200 shrink-0">
          {/* Left: greeting + date */}
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
              {getGreeting()}, {session.name.split(" ")[0]}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-slate-900">
              {new Date().toLocaleDateString("en-GH", { weekday: "long", day: "numeric", month: "short" })}
            </p>
          </div>

          {/* Right: notification + profile */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500" />
            </button>

            {/* Profile menu (visual only) */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{session.name}</p>
                <p className="text-xs text-slate-500 capitalize">{session.role.toLowerCase()}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {session.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="sm:hidden flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {session.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
