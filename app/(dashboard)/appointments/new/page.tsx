"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  phoneNumber: string;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/patients?limit=100")
      .then((r) => r.json())
      .then((data) => setPatients(data.patients));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;

    const body = {
      patientId: formData.get("patientId") as string,
      appointmentDate: new Date(`${date}T${time}`).toISOString(),
      type: (formData.get("type") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    };

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create appointment");
      setLoading(false);
      return;
    }

    router.push("/appointments");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/appointments"
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Schedule Appointment
          </h1>
          <p className="text-sm text-slate-500">
            Create a new appointment for a patient
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Patient *
          </label>
          <select
            name="patientId"
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">Select a patient...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.phoneNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Date *
            </label>
            <input
              name="date"
              type="date"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Time *
            </label>
            <input
              name="time"
              type="time"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Appointment Type
          </label>
          <select
            name="type"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">Select type...</option>
            <option value="General Checkup">General Checkup</option>
            <option value="Follow-up Visit">Follow-up Visit</option>
            <option value="Vaccination">Vaccination</option>
            <option value="Lab Test">Lab Test</option>
            <option value="Specialist Referral">Specialist Referral</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="Any notes for this appointment..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Scheduling..." : "Schedule Appointment"}
          </button>
          <Link
            href="/appointments"
            className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
