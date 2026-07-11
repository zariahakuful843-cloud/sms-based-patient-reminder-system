import Link from "next/link";
import type { ReactNode } from "react";

export type QuickAction = {
  label: string;
  description?: string;
  href: string;
  icon: ReactNode;
};

export type UpcomingItem = {
  label: string;
  description?: string;
};

export function RoleDashboard({
  role,
  name,
  title,
  subtitle,
  actions,
  upcoming,
  children,
}: {
  role: string;
  name?: string;
  title: string;
  subtitle: string;
  actions: QuickAction[];
  upcoming?: UpcomingItem[];
  children?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-blue-700">{role} WORKSPACE</p>
            <h1 className="mt-1 text-lg sm:text-xl font-bold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          {name ? (
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-slate-600">Signed in</p>
              <p className="text-sm font-semibold text-slate-900">{name}</p>
              <p className="text-xs text-slate-500">{role}</p>
            </div>
          ) : null}
        </div>
      </div>

      {children}

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900">Quick Actions</h2>
          <p className="text-xs text-slate-500">Tasks available to your role</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {actions.map((a) => (
            <Link
              key={a.href + a.label}
              href={a.href}
              className="group rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 group-hover:bg-blue-100 transition-colors">
                  {a.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm sm:text-base font-semibold text-slate-900">{a.label}</span>
                  {a.description ? (
                    <span className="block text-xs text-slate-500">{a.description}</span>
                  ) : null}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {upcoming && upcoming.length > 0 ? (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">Clinical Modules</h2>
              <p className="text-xs text-slate-500">Coming in Phase 2</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-semibold ring-1 ring-amber-100">
              In progress
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {upcoming.map((u) => (
              <div
                key={u.label}
                className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 opacity-80"
              >
                <p className="text-sm font-semibold text-slate-700">{u.label}</p>
                {u.description ? <p className="text-xs text-slate-500">{u.description}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
