"use client";

import { useState, useEffect } from "react";

type Role = "ADMIN" | "RECEPTIONIST" | "NURSE" | "DOCTOR";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatDateTime, calculateAge } from "@/lib/utils";

type Appointment = {
  id: number;
  doctorName: string;
  appointmentDate: string;
  status: string;
  notes?: string;
};

type SMSLog = {
  id: number;
  message: string;
  status: string;
  reminderType: string;
  sentAt: string;
};

type Patient = {
  id: number;
  fullName: string;
  gender: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  createdAt: string;
  appointments: Appointment[];
  smsLogs: SMSLog[];
};

export default function PatientDetailPage() {
  const [role, setRole] = useState<Role | null>(null);

  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", gender: "", phoneNumber: "", address: "", dateOfBirth: "" });
  const [error, setError] = useState("");

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
    fetch(`/api/patients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPatient(data);
        setForm({
          fullName: data.fullName,
          gender: data.gender,
          phoneNumber: data.phoneNumber,
          address: data.address,
          dateOfBirth: data.dateOfBirth?.split("T")[0] ?? "",
        });
        setLoading(false);
      });
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/patients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setPatient((p) => p ? { ...p, ...data } : null);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete patient "${patient?.fullName}"? This will also remove all appointments and SMS logs.`)) return;
    await fetch(`/api/patients/${id}`, { method: "DELETE" });
    router.push("/patients");
  }

  if (loading) return <div className="py-20 text-center text-sm text-slate-400">Loading…</div>;
  if (!patient) return <div className="py-20 text-center text-sm text-slate-400">Patient not found.</div>;

  const canEditPatient = role === "ADMIN" || role === "RECEPTIONIST";
  const canDeletePatient = role === "ADMIN";
  const canScheduleAppointment = role === "ADMIN";
  const showSmsHistory = false;

  return (
    <div>
      <PageHeader
        title={patient.fullName}
        description={`Patient ID: #${patient.id} · Registered ${formatDate(patient.createdAt)}`}
        action={
          <div className="flex gap-2">
            {canScheduleAppointment && (
              <Link href={`/appointments/new?patientId=${patient.id}`}>
                <Button size="sm" variant="secondary">Schedule Appointment</Button>
              </Link>
            )}
            {canEditPatient && (
              <Button size="sm" onClick={() => setEditing(!editing)}>
                {editing ? "Cancel Edit" : "Edit"}
              </Button>
            )}
            {canDeletePatient && (
              <Button size="sm" variant="danger" onClick={handleDelete}>Delete</Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient info */}
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                {patient.fullName.charAt(0)}
              </div>
              <h2 className="text-lg font-bold">{patient.fullName}</h2>
              <p className="text-sm text-blue-100">{patient.phoneNumber}</p>
            </div>
            {editing ? (
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <Input id="fullName" label="Full Name" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                <Select id="gender" label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} />
                <Input id="phone" label="Phone" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
                <Input id="dob" label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                <Textarea id="address" label="Address" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <Button type="submit" size="sm" loading={saving}>Save Changes</Button>
              </form>
            ) : (
              <dl className="divide-y divide-slate-100 px-5 py-3 text-sm">
                {[
                  { label: "Gender", value: patient.gender },
                  { label: "Date of Birth", value: `${formatDate(patient.dateOfBirth)} (${calculateAge(patient.dateOfBirth)} yrs)` },
                  { label: "Phone", value: patient.phoneNumber },
                  { label: "Address", value: patient.address },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-right text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {/* Appointments + SMS */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Appointments ({patient.appointments.length})</h3>
              {canScheduleAppointment && (
                <Link href={`/appointments/new?patientId=${patient.id}`} className="text-xs font-medium text-blue-600 hover:underline">+ New</Link>
              )}
            </div>
            {patient.appointments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No appointments yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {patient.appointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Dr. {a.doctorName}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(a.appointmentDate)}</p>
                    </div>
                    <Badge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {showSmsHistory && (
            <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-900">SMS History ({patient.smsLogs.length})</h3>
              </div>
            {patient.smsLogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No SMS sent yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {patient.smsLogs.map((s) => (
                  <li key={s.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-slate-700 flex-1">{s.message}</p>
                      <div className="shrink-0 text-right">
                        <Badge status={s.status} />
                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(s.sentAt)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
