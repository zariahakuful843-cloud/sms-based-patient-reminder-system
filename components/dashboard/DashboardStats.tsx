"use client";

import { useEffect, useState } from "react";

type Card = { label: string; value: number | string; hint?: string };
type Activity = { label: string; detail?: string; when?: string };

function whenLabel(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function DashboardStats() {
  const [cards, setCards] = useState<Card[]>([]);
  const [recent, setRecent] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setCards(d.cards ?? []);
        setRecent(d.recent ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />
            ))
          : cards.map((c) => (
              <div key={c.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
                <p className="text-xs font-medium text-slate-500">{c.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{c.value}</p>
                {c.hint ? <p className="text-xs text-slate-400">{c.hint}</p> : null}
              </div>
            ))}
      </div>

      {!loading && recent.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 sm:text-base">Recent Activity</h2>
          <ul className="divide-y divide-slate-100">
            {recent.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{a.label}</p>
                  {a.detail ? <p className="text-xs text-slate-500">{a.detail}</p> : null}
                </div>
                <span className="shrink-0 text-xs text-slate-400">{whenLabel(a.when)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
