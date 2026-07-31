"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";

type Patient = { id: number; fullName: string; phoneNumber: string };
type Doctor = { id: number; name: string };
type Session = { role?: string; userId?: number; name?: string };

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillPatientId = searchParams.get("patientId");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    patientId: prefillPatientId ?? "",
    doctorId: "",
    appointmentDate: "",
    appointmentTime: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/patients?limit=200")
      .then((r) => r.json())
      .then((d) => setPatients(d.patients ?? []));
    fetch("/api/users?role=DOCTOR&limit=100")
      .then((r) => r.json())
      .then((d) => setDoctors(d.users ?? []));
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((s) => {
        setSession(s);
        if (s.role === "DOCTOR" && s.userId) {
          setForm((f) => ({ ...f, doctorId: String(s.userId) }));
        }
      });
  }, []);

  const isDoctor = session?.role === "DOCTOR";

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const appointmentDate = form.appointmentDate && form.appointmentTime
      ? new Date(`${form.appointmentDate}T${form.appointmentTime}`).toISOString()
      : null;

    if (!appointmentDate) {
      setError("Please select both date and time.");
      setLoading(false);
      return;
    }

    const selectedDoctor = doctors.find((d) => String(d.id) === form.doctorId);

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: parseInt(form.patientId),
        doctorId: form.doctorId || null,
        doctorName: selectedDoctor?.name ?? "",
        appointmentDate,
        notes: form.notes || null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to create appointment.");
      return;
    }

    router.push("/appointments");
  }

  const patientOptions = [
    { value: "", label: "Select a patient…" },
    ...patients.map((p) => ({ value: String(p.id), label: `${p.fullName} (${p.phoneNumber})` })),
  ];

  return (
    <div>
      <PageHeader
        title="New Appointment"
        description="Schedule an appointment for a patient"
        action={
          <Link href="/appointments">
            <Button variant="secondary" size="sm">Cancel</Button>
          </Link>
        }
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-5">
          <Select
            id="patientId"
            label="Patient"
            required
            value={form.patientId}
            onChange={(e) => set("patientId", e.target.value)}
            options={patientOptions}
          />

          {isDoctor ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Doctor / Clinician</label>
              <div className="h-9 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                {session?.name} (you)
              </div>
            </div>
          ) : (
            <Select
              id="doctorId"
              label="Doctor / Clinician"
              required
              value={form.doctorId}
              onChange={(e) => set("doctorId", e.target.value)}
              options={[
                { value: "", label: "Select a doctor…" },
                ...doctors.map((d) => ({ value: String(d.id), label: d.name })),
              ]}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="appointmentDate"
              label="Appointment Date"
              type="date"
              required
              value={form.appointmentDate}
              onChange={(e) => set("appointmentDate", e.target.value)}
            />
            <Input
              id="appointmentTime"
              label="Time"
              type="time"
              required
              value={form.appointmentTime}
              onChange={(e) => set("appointmentTime", e.target.value)}
            />
          </div>

          <Textarea
            id="notes"
            label="Notes (optional)"
            rows={3}
            placeholder="Any additional notes about this appointment…"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Schedule Appointment</Button>
            <Link href="/appointments"><Button type="button" variant="secondary">Cancel</Button></Link>
          </div>
        </form>
      </div>
    </div>
  );
}
