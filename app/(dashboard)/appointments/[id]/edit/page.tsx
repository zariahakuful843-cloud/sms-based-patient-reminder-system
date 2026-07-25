"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

type Role = "ADMIN" | "RECEPTIONIST" | "NURSE" | "DOCTOR";

type Appointment = {
  id: number;
  doctorName: string;
  appointmentDate: string;
  status: string;
  reminderSent: boolean;
  notes?: string;
  patient: { id: number; fullName: string; phoneNumber: string };
};

export default function AppointmentEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
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

  useEffect(() => {
    if (!id) return;
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

  const canUpdateAppointment = role === "ADMIN" || role === "RECEPTIONIST";
  const canDeleteAppointment = role === "ADMIN";
  const canUpdateStatus = role === "ADMIN" || role === "RECEPTIONIST" || role === "NURSE";
  const canEditConsultationNotes = role === "ADMIN" || role === "DOCTOR";
  const canSave = Boolean(canUpdateAppointment || canUpdateStatus || canEditConsultationNotes);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const appointmentDate = new Date(`${form.appointmentDate}T${form.appointmentTime}`).toISOString();

   const payload: Record<string, unknown> = {};

if (canUpdateAppointment) {
  payload.doctorName = form.doctorName;
  payload.appointmentDate = appointmentDate;
}
if (canUpdateStatus) {
  payload.status = form.status;
}
if (canEditConsultationNotes) {
  payload.notes = form.notes;
}

    const res = await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to update appointment.");
      return;
    }

    router.push(`/appointments/${id}`);
  }

  async function handleDelete() {
    if (!confirm("Delete this appointment?")) return;
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    router.push("/appointments");
  }

  if (loading) return <div className="py-20 text-center text-sm text-slate-400">Loading…</div>;
  if (!appt) return <div className="py-20 text-center text-sm text-slate-400">Appointment not found.</div>;

  const canShowStatusField = canUpdateStatus;
  const canShowDoctorField = role !== "DOCTOR";

  return (
    <div>
      <PageHeader
        title="Edit Appointment"
        description={`For ${appt.patient.fullName}`}
        action={
          <div className="flex gap-2">
            <Link href={`/appointments/${id}`}>
              <Button variant="secondary" size="sm">Back</Button>
            </Link>
            {canDeleteAppointment && (
              <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
            )}
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

          {canShowDoctorField && (
            <Input
              id="doctorName"
              label="Doctor / Clinician"
              required={role === "ADMIN" || role === "RECEPTIONIST"}
              value={form.doctorName}
              onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
              disabled={!canUpdateAppointment}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="date"
              label="Appointment Date"
              type="date"
              required
              value={form.appointmentDate}
              onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
              disabled={!canUpdateAppointment}
            />
            <Input
              id="time"
              label="Time"
              type="time"
              required
              value={form.appointmentTime}
              onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
              disabled={!canUpdateAppointment}
            />
          </div>

          {canShowStatusField ? (
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
          ) : (
            <Input id="status" label="Status" value={appt.status} disabled />
          )}

          {/* Consultation notes */}
          <Textarea
            id="notes"
            label="Consultation Notes"
            rows={4}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            disabled={!canEditConsultationNotes}
          />

          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex gap-3">
            {canSave && (
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
            )}
            <Link href={`/appointments/${id}`}>
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
