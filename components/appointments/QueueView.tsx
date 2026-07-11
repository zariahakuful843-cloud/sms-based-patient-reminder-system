"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { useSession, useCan } from "@/lib/session-context";
import { QUEUE_STATUSES, queueStatusLabel } from "@/lib/queue";

type QueueItem = {
  id: number;
  appointmentDate: string;
  appointmentType: string | null;
  queueStatus: string;
  queueNumber: number | null;
  doctorId: number | null;
  patient: { id: number; fullName: string; phoneNumber: string };
  department: { id: number; name: string; code: string } | null;
  doctor: { id: number; name: string } | null;
};

type SortKey = "time" | "waiting" | "status";

function waitingMinutes(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function waitingLabel(iso: string): string {
  const m = waitingMinutes(iso);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function QueueView() {
  const { userId, role } = useSession();
  const can = useCan();
  const isDoctor = role === "DOCTOR";
  const canManageQueue = can("queue.manage") || can("consultation.manage");

  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("time");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/queue");
    const data = await res.json();
    setItems(data.appointments ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => {
    const copy = [...items];
    if (sort === "time") {
      copy.sort((a, b) => +new Date(a.appointmentDate) - +new Date(b.appointmentDate));
    } else if (sort === "waiting") {
      copy.sort((a, b) => waitingMinutes(b.appointmentDate) - waitingMinutes(a.appointmentDate));
    } else {
      copy.sort((a, b) => QUEUE_STATUSES.indexOf(a.queueStatus as never) - QUEUE_STATUSES.indexOf(b.queueStatus as never));
    }
    return copy;
  }, [items, sort]);

  async function updateStatus(id: number, queueStatus: string) {
    await fetch(`/api/appointments/${id}/queue`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueStatus }),
    });
    load();
  }

  async function claim(id: number) {
    const res = await fetch(`/api/appointments/${id}/claim`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Could not claim patient.");
    }
    load();
  }

  return (
    <div>
      <PageHeader
        title="Appointments"
        description={
          isDoctor
            ? "Your patients and unclaimed patients in your department"
            : "Today's patient queue for your department"
        }
        action={
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="time">Appointment Time</option>
              <option value="waiting">Waiting Time</option>
              <option value="status">Queue Status</option>
            </select>
          </div>
        }
      />

      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["#", "Patient", "Time", "Department", "Doctor", "Status", "Waiting", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-slate-400">Loading…</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-slate-400">No patients in the queue today.</td></tr>
            ) : (
              sorted.map((a) => {
                const unassigned = a.doctorId === null;
                const mine = a.doctorId === userId;
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-500">{a.queueNumber ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{a.patient.fullName}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(a.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{a.department?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.doctor ? a.doctor.name : <span className="text-amber-600">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      {canManageQueue ? (
                        <select
                          value={a.queueStatus}
                          onChange={(e) => updateStatus(a.id, e.target.value)}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                        >
                          {QUEUE_STATUSES.map((s) => (
                            <option key={s} value={s}>{queueStatusLabel(s)}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge status={a.queueStatus} label={queueStatusLabel(a.queueStatus)} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{waitingLabel(a.appointmentDate)}</td>
                    <td className="px-4 py-3">
                      {isDoctor && unassigned && (
                        <button
                          onClick={() => claim(a.id)}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          Claim
                        </button>
                      )}
                      {isDoctor && mine && (
                        <button
                          onClick={() => updateStatus(a.id, "CONSULTATION_COMPLETED")}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
