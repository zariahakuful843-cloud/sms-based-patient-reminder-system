"use client";

import { useState, useEffect } from "react";
import { Bell, Play } from "lucide-react";

interface Reminder {
  id: string;
  scheduledFor: string;
  sentAt: string | null;
  status: string;
  appointment: {
    appointmentDate: string;
    type: string | null;
    patient: { name: string; phoneNumber: string };
  };
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/reminders?status=${filter}`);
      const data = await res.json();
      if (!cancelled) {
        setReminders(data.reminders);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filter, refreshKey]);

  async function processReminders() {
    setProcessing(true);
    setResult(null);
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "process" }),
    });
    const data = await res.json();
    setResult(
      `Processed ${data.processed} reminders: ${data.sent} sent, ${data.failed} failed`
    );
    setProcessing(false);
    setRefreshKey((k) => k + 1);
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    SENT: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reminders</h1>
          <p className="text-sm text-slate-500">
            Automated appointment reminders
          </p>
        </div>
        <button
          onClick={processReminders}
          disabled={processing}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          {processing ? "Processing..." : "Process Now"}
        </button>
      </div>

      {result && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
          {result}
        </div>
      )}

      <div className="flex gap-2">
        {["", "PENDING", "SENT", "FAILED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === s
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
        ) : reminders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-8">
            <Bell className="h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No reminders found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm font-medium text-slate-500">
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Appointment</th>
                <th className="px-5 py-3">Scheduled For</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Sent At</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((rem) => (
                <tr
                  key={rem.id}
                  className="border-b last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-slate-800">
                      {rem.appointment.patient.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {rem.appointment.patient.phoneNumber}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {new Date(
                      rem.appointment.appointmentDate
                    ).toLocaleDateString()}{" "}
                    • {rem.appointment.type || "General"}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {new Date(rem.scheduledFor).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[rem.status] || ""}`}
                    >
                      {rem.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500">
                    {rem.sentAt
                      ? new Date(rem.sentAt).toLocaleString()
                      : "—"}
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
