"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

type Appointment = {
  id: number;
  doctorName: string;
  appointmentDate: string;
  status: string;
  reminderSent: boolean;
  notes?: string;
  patient: { id: number; fullName: string; phoneNumber: string };
};

export default function EditAppointmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    doctorName: "",
    appointmentDate: "",
    appointmentTime: "",
    status: "",
    notes: "",
  });

  useEffect(() => {
    fetch(`/api/appointments/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAppt(data);
        const dt = new Date(data.appointmentDate);
        setForm({
          doctorName: data.doctorName,
          appointmentDate: dt.toISOString().split("T")[0],
          appointmentTime: dt.toTimeString().slice(0, 5),
          status: data.status,
          notes: data.notes ?? "",
        });
        setLoading(false);
      });
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const appointmentDate = new Date(`${form.appointmentDate}T${form.appointmentTime}`).toISOString();

    const res = await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, appointmentDate }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error); return; }
    router.push("/appointments");
  }

  async function handleDelete() {
    if (!confirm("Delete this appointment?")) return;
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    router.push("/appointments");
  }

  if (loading) return <div className="py-20 text-center text-sm text-slate-400">Loading…</div>;
  if (!appt) return <div className="py-20 text-center text-sm text-slate-400">Appointment not found.</div>;

  return (
    <div>
      <PageHeader
        title="Edit Appointment"
        description={`For ${appt.patient.fullName}`}
        action={
          <div className="flex gap-2">
            <Link href="/appointments"><Button variant="secondary" size="sm">Back</Button></Link>
            <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
          </div>
        }
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSave} className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {appt.patient.fullName.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{appt.patient.fullName}</p>
              <p className="text-sm text-slate-500">{appt.patient.phoneNumber}</p>
            </div>
            <Badge status={appt.status} />
          </div>

          <Input
            id="doctorName"
            label="Doctor / Clinician"
            required
            value={form.doctorName}
            onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="date"
              label="Appointment Date"
              type="date"
              required
              value={form.appointmentDate}
              onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
            />
            <Input
              id="time"
              label="Time"
              type="time"
              required
              value={form.appointmentTime}
              onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
            />
          </div>

          <Select
            id="status"
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: "SCHEDULED", label: "Scheduled" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
              { value: "MISSED", label: "Missed" },
            ]}
          />

          <Textarea
            id="notes"
            label="Notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex gap-3">
            <Button type="submit" loading={saving}>Save Changes</Button>
            <Link href="/appointments"><Button type="button" variant="secondary">Cancel</Button></Link>
          </div>
        </form>
      </div>
    </div>
  );
}
