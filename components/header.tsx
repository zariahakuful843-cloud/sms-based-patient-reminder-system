"use client";

import { useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <h2 className="text-lg font-semibold text-slate-800">
        Patient Reminder System
      </h2>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-700">
            {session?.user?.name}
          </p>
          <p className="text-xs text-slate-500">{session?.user?.email}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
          {session?.user?.name?.charAt(0) ?? "U"}
        </div>
      </div>
    </header>
  );
}
