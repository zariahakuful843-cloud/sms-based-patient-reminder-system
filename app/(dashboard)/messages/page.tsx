"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  phoneNumber: string;
}

interface Message {
  id: string;
  content: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  patient: { name: string; phoneNumber: string };
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [msgRes, patRes] = await Promise.all([
        fetch("/api/messages?limit=50"),
        fetch("/api/patients?limit=100"),
      ]);
      const msgData = await msgRes.json();
      const patData = await patRes.json();
      if (!cancelled) {
        setMessages(msgData.messages);
        setPatients(patData.patients);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSending(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      patientId: formData.get("patientId") as string,
      content: formData.get("content") as string,
    };

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to send");
    } else {
      setShowForm(false);
      setRefreshKey((k) => k + 1);
    }
    setSending(false);
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    SENT: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Messages</h1>
          <p className="text-sm text-slate-500">SMS message history and sending</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Send className="h-4 w-4" />
          Send SMS
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSend}
          className="space-y-4 rounded-xl bg-white p-5 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-800">Send New SMS</h3>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Patient
            </label>
            <select
              name="patientId"
              required
              className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">Select a patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.phoneNumber})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Message
            </label>
            <textarea
              name="content"
              required
              rows={3}
              className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Type your message..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Message"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-8">
            <MessageSquare className="h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No messages sent yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm font-medium text-slate-500">
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Message</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Sent At</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr
                  key={msg.id}
                  className="border-b last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-slate-800">
                      {msg.patient.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {msg.patient.phoneNumber}
                    </p>
                  </td>
                  <td className="max-w-xs px-5 py-3">
                    <p className="truncate text-sm text-slate-600">
                      {msg.content}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[msg.status] || ""}`}
                    >
                      {msg.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500">
                    {msg.sentAt
                      ? new Date(msg.sentAt).toLocaleString()
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
