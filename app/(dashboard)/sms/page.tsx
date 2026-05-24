"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

type SMSLog = {
  id: number;
  phoneNumber: string;
  message: string;
  messageType: string;
  deliveryStatus: string;
  sentAt: string;
  patient: { id: number; fullName: string };
};

type Patient = { id: number; fullName: string; phoneNumber: string };

const MESSAGE_TEMPLATES: Record<string, string> = {
  APPOINTMENT: "Dear {name}, this is a reminder of your appointment at our facility. Please arrive 15 minutes early.",
  MEDICATION: "Dear {name}, this is a reminder to take your prescribed medication as directed by your doctor.",
  VACCINATION: "Dear {name}, you are due for a vaccination at our facility. Please visit us at your earliest convenience.",
  ANTENATAL: "Dear {name}, you are due for your antenatal visit. Please contact us to schedule your appointment.",
};

export default function SMSPage() {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");
  const [sendError, setSendError] = useState("");

  const [form, setForm] = useState({
    patientId: "",
    messageType: "APPOINTMENT",
    message: MESSAGE_TEMPLATES.APPOINTMENT,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status: statusFilter, page: String(page), limit: String(limit) });
    const res = await fetch(`/api/sms/logs?${params}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    fetch("/api/patients?limit=200")
      .then((r) => r.json())
      .then((d) => setPatients(d.patients ?? []));
  }, []);

  function handleTypeChange(type: string) {
    const selectedPatient = patients.find((p) => String(p.id) === form.patientId);
    const name = selectedPatient?.fullName ?? "{name}";
    const template = MESSAGE_TEMPLATES[type] ?? "";
    setForm((f) => ({
      ...f,
      messageType: type,
      message: template.replace("{name}", name.split(" ")[0]),
    }));
  }

  function handlePatientChange(patientId: string) {
    const p = patients.find((pt) => String(pt.id) === patientId);
    const name = p?.fullName.split(" ")[0] ?? "{name}";
    const template = MESSAGE_TEMPLATES[form.messageType] ?? "";
    setForm((f) => ({
      ...f,
      patientId,
      message: template.replace("{name}", name),
    }));
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setSendError("");
    setSuccess("");

    const res = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: parseInt(form.patientId),
        message: form.message,
        messageType: form.messageType,
      }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setSendError(data.error ?? "Failed to send SMS.");
      return;
    }

    setSuccess("SMS sent successfully!");
    setShowForm(false);
    setForm({ patientId: "", messageType: "APPOINTMENT", message: MESSAGE_TEMPLATES.APPOINTMENT });
    fetchLogs();
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageHeader
        title="SMS & Reminders"
        description={`${total} message${total !== 1 ? "s" : ""} sent`}
        action={
          <Button size="sm" onClick={() => { setShowForm(!showForm); setSuccess(""); setSendError(""); }}>
            {showForm ? "Cancel" : "Send SMS"}
          </Button>
        }
      />

      {/* Send form */}
      {showForm && (
        <div className="mb-6 max-w-2xl rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Send New SMS</h3>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Patient <span className="text-red-500">*</span></label>
              <select
                required
                value={form.patientId}
                onChange={(e) => handlePatientChange(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName} ({p.phoneNumber})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Message Type</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(MESSAGE_TEMPLATES).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeChange(type)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      form.messageType === type
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Message</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400">{form.message.length} characters</p>
            </div>

            {sendError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{sendError}</div>
            )}

            <div className="flex gap-3">
              <Button type="submit" loading={sending}>Send Message</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search by patient or phone…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-9 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* Logs table */}
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Patient", "Phone", "Type", "Message", "Status", "Sent At"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">No SMS logs yet.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{log.patient.fullName}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{log.phoneNumber}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {log.messageType}
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-slate-600">
                    <p className="truncate">{log.message}</p>
                  </td>
                  <td className="px-4 py-3"><Badge status={log.deliveryStatus} /></td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(log.sentAt)}</td>
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
