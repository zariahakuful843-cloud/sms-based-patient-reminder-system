"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { useCan } from "@/lib/session-context";
import { QueueView } from "@/components/appointments/QueueView";

type Appointment = {
  id: number;
  doctorName: string | null;
  appointmentDate: string;
  appointmentType: string | null;
  status: string;
  reminderSent: boolean;
  notes?: string;
  patient: { id: number; fullName: string; phoneNumber: string };
  department: { id: number; name: string; code: string } | null;
  doctor: { id: number; name: string } | null;
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "MISSED", label: "Missed" },
];

export default function AppointmentsPage() {
  const can = useCan();
  const canManage = can("appointments.manage");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status, page: String(page), limit: String(limit) });
    const res = await fetch(`/api/appointments?${params}`);
    const data = await res.json();
    setAppointments(data.appointments ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, status, page]);

  useEffect(() => { if (canManage) fetchAppointments(); }, [fetchAppointments, canManage]);

  // Nurses and doctors work from the department queue, not the management list.
  if (!canManage) {
    return <QueueView />;
  }

  async function updateStatus(id: number, newStatus: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchAppointments();
  }

  async function handleDelete(id: number) {
    if (!confirm("Cancel this appointment?")) return;
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    fetchAppointments();
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageHeader
        title="Appointments"
        description={`${total} appointment${total !== 1 ? "s" : ""}`}
        action={
          <Link href="/appointments/new">
            <Button size="sm">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Appointment
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search by patient or doctor…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-9 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Patient", "Department", "Doctor", "Date & Time", "Status", "Reminder", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">Loading…</td></tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                  No appointments found.{" "}
                  <Link href="/appointments/new" className="text-blue-600 hover:underline">Schedule one.</Link>
                </td>
              </tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/patients/${a.patient.id}`} className="font-medium text-blue-600 hover:underline">
                      {a.patient.fullName}
                    </Link>
                    <p className="text-xs text-slate-400">{a.patient.phoneNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.department?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{a.doctor ? a.doctor.name : <span className="text-amber-600">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDateTime(a.appointmentDate)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value)}
                      className="rounded-md border-0 bg-transparent text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      {["SCHEDULED", "COMPLETED", "CANCELLED", "MISSED"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {a.reminderSent ? (
                      <span className="text-xs text-emerald-600">✓ Sent</span>
                    ) : (
                      <span className="text-xs text-amber-500">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/appointments/${a.id}`}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
