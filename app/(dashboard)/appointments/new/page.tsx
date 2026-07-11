"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";

type Patient = { id: number; fullName: string; phoneNumber: string };
type Department = { id: number; name: string; active: boolean };
type Doctor = { id: number; name: string };

const APPOINTMENT_TYPES = ["Consultation", "Follow-up", "Review", "Vaccination", "Antenatal", "Procedure"];

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillPatientId = searchParams.get("patientId");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    patientId: prefillPatientId ?? "",
    departmentId: "",
    doctorId: "",
    appointmentType: "Consultation",
    appointmentDate: "",
    appointmentTime: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/patients?limit=200")
      .then((r) => r.json())
      .then((d) => setPatients(d.patients ?? []));
    fetch("/api/departments?activeOnly=1")
      .then((r) => r.json())
      .then((d) => setDepartments(Array.isArray(d) ? d : []));
  }, []);

  // When the department changes, load only that department's doctors and reset
  // any previously chosen doctor.
  useEffect(() => {
    if (!form.departmentId) {
      setDoctors([]);
      return;
    }
    fetch(`/api/users/doctors?departmentId=${form.departmentId}`)
      .then((r) => r.json())
      .then((d) => setDoctors(Array.isArray(d) ? d : []));
  }, [form.departmentId]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const appointmentDate =
      form.appointmentDate && form.appointmentTime
        ? new Date(`${form.appointmentDate}T${form.appointmentTime}`).toISOString()
        : null;

    if (!form.departmentId) {
      setError("Please select a department.");
      setLoading(false);
      return;
    }
    if (!appointmentDate) {
      setError("Please select both date and time.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: parseInt(form.patientId),
        departmentId: parseInt(form.departmentId),
        doctorId: form.doctorId ? parseInt(form.doctorId) : null,
        appointmentType: form.appointmentType,
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
  const departmentOptions = [
    { value: "", label: "Select a department…" },
    ...departments.map((d) => ({ value: String(d.id), label: d.name })),
  ];
  const doctorOptions = [
    { value: "", label: form.departmentId ? "Any available doctor (optional)" : "Select a department first" },
    ...doctors.map((d) => ({ value: String(d.id), label: d.name })),
  ];
  const typeOptions = APPOINTMENT_TYPES.map((t) => ({ value: t, label: t }));

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

          <Select
            id="departmentId"
            label="Department"
            required
            value={form.departmentId}
            onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value, doctorId: "" }))}
            options={departmentOptions}
          />

          <Select
            id="doctorId"
            label="Doctor (optional)"
            value={form.doctorId}
            disabled={!form.departmentId}
            onChange={(e) => set("doctorId", e.target.value)}
            options={doctorOptions}
          />

          <Select
            id="appointmentType"
            label="Appointment Type"
            required
            value={form.appointmentType}
            onChange={(e) => set("appointmentType", e.target.value)}
            options={typeOptions}
          />

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
            label="Notes"
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
