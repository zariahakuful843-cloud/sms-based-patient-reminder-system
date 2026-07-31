"use client";

import { useState, type ReactNode } from "react";

export function MobileShell({
  sidebar,
  greeting,
  name,
  role,
  dateLabel,
  children,
}: {
  sidebar: ReactNode;
  greeting: string;
  name: string;
  role: string;
  dateLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Dark overlay behind the drawer on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar: slides in as a drawer on mobile, always visible on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between bg-white px-4 sm:px-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger button, mobile only */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{greeting}, {name.split(" ")[0]}</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-900">{dateLabel}</p>
            </div>
          </div>

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

            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{name}</p>
                <p className="text-xs text-slate-500 capitalize">{role.toLowerCase()}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="sm:hidden flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
