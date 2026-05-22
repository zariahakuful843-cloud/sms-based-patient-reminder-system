"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";

interface Appointment {
  id: string;
  appointmentDate: string;
  type: string | null;
  status: string;
  patient: { id: string; name: string; phoneNumber: string };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await fetch(
        `/api/appointments?status=${status}&limit=50`
      );
      const data = await res.json();
      if (!cancelled) {
        setAppointments(data.appointments);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [status, refreshKey]);

  async function updateStatus(id: string, newStatus: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setRefreshKey((k) => k + 1);
  }

  const statusColors: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    NO_SHOW: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
          <p className="text-sm text-slate-500">
            Manage patient appointments
          </p>
        </div>
        <Link
          href="/appointments/new"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </Link>
      </div>

      <div className="flex gap-2">
        {["", "SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              status === s
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-8">
            <Calendar className="h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No appointments found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm font-medium text-slate-500">
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr
                  key={apt.id}
                  className="border-b last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-slate-800">
                      {apt.patient.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {apt.patient.phoneNumber}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {new Date(apt.appointmentDate).toLocaleDateString()}
                    {" at "}
                    {new Date(apt.appointmentDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {apt.type || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[apt.status] || ""}`}
                    >
                      {apt.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {apt.status === "SCHEDULED" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateStatus(apt.id, "COMPLETED")}
                          className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => updateStatus(apt.id, "NO_SHOW")}
                          className="rounded px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                        >
                          No Show
                        </button>
                        <button
                          onClick={() => updateStatus(apt.id, "CANCELLED")}
                          className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
