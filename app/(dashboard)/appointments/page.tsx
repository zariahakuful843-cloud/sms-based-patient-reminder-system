"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

type Role = "ADMIN" | "RECEPTIONIST" | "NURSE" | "DOCTOR";

type Appointment = {
  id: number;
  doctorName: string;
  appointmentDate: string;
  status: string;
  reminderSent: boolean;
  patient: { id: number; fullName: string; phoneNumber: string };
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "MISSED", label: "Missed" },
];

export default function AppointmentsPage() {
  const [role, setRole] = useState<Role | null>(null);

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

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setRole(null);
        return;
      }
      const session = (await res.json()) as { role?: string };
      const detected = (session?.role ?? "ANONYMOUS").trim().toUpperCase();
      if (detected === "ADMIN" || detected === "RECEPTIONIST" || detected === "NURSE" || detected === "DOCTOR") {
        setRole(detected as Role);
      } else {
        setRole(null);
      }
    })();
  }, []);

 async function updateStatus(id: number, newStatus: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchAppointments();
  }

  async function toggleReminder(id: number, current: boolean) {
    await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderSent: !current }),
    });
    fetchAppointments();
  }

  async function handleDelete(id: number) {
    if (!confirm("Cancel this appointment?")) return;
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    fetchAppointments();
  }

  const totalPages = Math.ceil(total / limit);

  // Workflow rules:
  // ADMIN: full CRUD + status editing
  // RECEPTIONIST: view + details (via /appointments/[id]) + status editing + create/edit; no delete
  // NURSE: view + status editing only (no create/edit/delete)
  // DOCTOR: view + open appointment + edit consultation notes only (no status editing from list)

  const canCreateAppointment = role === "ADMIN" || role === "RECEPTIONIST";
  const canEditAppointment = role === "ADMIN" || role === "RECEPTIONIST";
  const canDeleteAppointment = role === "ADMIN";

  const canUpdateStatus = role === "ADMIN" || role === "RECEPTIONIST" || role === "NURSE";
  const showStatusSelect = canUpdateStatus;
  const canToggleReminder = role === "ADMIN" || role === "RECEPTIONIST";

  const showNewAppointment = canCreateAppointment;

  function formatDoctorName(doctorName: string) {
    const dn = (doctorName ?? "").trim();
    const nameWithoutPrefix = dn.replace(/^\s*dr\.\s*/i, "");
    return `Dr. ${nameWithoutPrefix}`.trim();
  }


  function appointmentActions(aId: number) {
    const isAdmin = role === "ADMIN";
    const isReceptionist = role === "RECEPTIONIST";
    const isNurse = role === "NURSE";
    const isDoctor = role === "DOCTOR";

    const canView = Boolean(role);
    const canEdit = (isAdmin || isReceptionist) && !isDoctor;
    const canDelete = isAdmin;

    const actions: React.ReactNode[] = [];

    if (canView) {
      actions.push(
        <Link
          key="view"
          href={`/appointments/${aId}`}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
        >
          {isDoctor ? "Open" : "View"}
        </Link>
      );
    }

    if (canEdit) {
      actions.push(
        <Link
          key="edit"
          href={`/appointments/${aId}/edit`}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
        >
          Edit
        </Link>
      );
    }

    if (canDelete) {
      actions.push(
        <button
          key="delete"
          onClick={() => handleDelete(aId)}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
        >
          Delete
        </button>
      );
    }

    if (actions.length === 0) {
      actions.push(
        <span
          key="fallback"
          className="cursor-not-allowed rounded-md px-2.5 py-1 text-xs font-medium text-slate-400 bg-slate-50 ring-1 ring-slate-200"
        >
          View
        </span>
      );
    }

    return actions;
  }

  return (
    <div>
      <PageHeader
        title="Appointments"
        description={`${total} appointment${total !== 1 ? "s" : ""}`}
        action={
          showNewAppointment ? (
            <Link href="/appointments/new">
              <Button size="sm">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Appointment
              </Button>
            </Link>
          ) : null
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search by patient or doctor…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-9 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Doctor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date &amp; Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Reminder</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-slate-400">Loading…</td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                  No appointments found. {showNewAppointment ? (
                    <Link href="/appointments/new" className="text-blue-600 hover:underline">Schedule one.</Link>
                  ) : (
                    <span />
                  )}
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

                  <td className="px-4 py-3 text-slate-700">{(() => { const dn = (a.doctorName ?? "").trim(); const noPrefix = dn.replace(/^\s*dr\.\s*/i, ""); return `Dr. ${noPrefix}`.trim(); })()}</td>

                  <td className="px-4 py-3 text-slate-700">{formatDateTime(a.appointmentDate)}</td>

                  <td className="px-4 py-3">
                    {showStatusSelect ? (
                      <select
                        value={a.status}
                        onChange={(e) => updateStatus(a.id, e.target.value)}
                        className="rounded-md border-0 bg-transparent text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                      >
                        {["SCHEDULED", "COMPLETED", "CANCELLED", "MISSED"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-semibold text-slate-800">{a.status}</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {canToggleReminder ? (
                      <button
                        onClick={() => toggleReminder(a.id, a.reminderSent)}
                        className={`text-xs font-medium rounded-md px-2 py-1 ${
                          a.reminderSent
                            ? "text-emerald-600 hover:bg-emerald-50"
                            : "text-amber-500 hover:bg-amber-50"
                        }`}
                        title="Click to toggle reminder status"
                      >
                        {a.reminderSent ? "✓ Sent" : "Pending"}
                      </button>
                    ) : a.reminderSent ? (
                      <span className="text-xs text-emerald-600">✓ Sent</span>
                    ) : (
                      <span className="text-xs text-amber-500">Pending</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">{appointmentActions(a.id)}</div>
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
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

