"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

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

export default function AppointmentDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [role, setRole] = useState<Role | null>(null);
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      });
  }, [id]);

  const canUpdateAppointment = role === "ADMIN" || role === "RECEPTIONIST";
  const canUpdateStatus = role === "ADMIN" || role === "RECEPTIONIST" || role === "NURSE";
  const canEditConsultationNotes = role === "ADMIN" || role === "DOCTOR";
  const canDeleteAppointment = role === "ADMIN";

  // Anyone who can change any part of the appointment gets an Edit button.
  const canEdit = canUpdateAppointment || canUpdateStatus || canEditConsultationNotes;

  async function handleDelete() {
    if (!confirm("Delete this appointment?")) return;
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    window.location.href = "/appointments";
  }

  if (loading) return <div className="py-20 text-center text-sm text-slate-400">Loading…</div>;
  if (!appt) return <div className="py-20 text-center text-sm text-slate-400">Appointment not found.</div>;

  function formatDoctorName(doctorName: string) {
    const dn = (doctorName ?? "").trim();
    const nameWithoutPrefix = dn.replace(/^\s*dr\.\s*/i, "");
    return `Dr. ${nameWithoutPrefix}`.trim();
  }

  return (
    <div>
      <PageHeader
        title="Appointment"
        description={`For ${appt.patient.fullName}`}
        action={
          <div className="flex gap-2">
            <Link href="/appointments">
              <Button variant="secondary" size="sm">Back</Button>
            </Link>
            {canEdit && (
              <Link href={`/appointments/${id}/edit`}>
                <Button size="sm">Edit</Button>
              </Link>
            )}
            {canDeleteAppointment && (
              <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
            )}
          </div>
        }
      />

      <div className="max-w-2xl">
        <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-5">
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

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Doctor / Clinician</p>
            <p className="mt-1 text-sm text-slate-900">{formatDoctorName(appt.doctorName)}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Appointment Date &amp; Time</p>
              <p className="mt-1 text-sm text-slate-900">{formatDateTime(appt.appointmentDate)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reminder</p>
              <p className="mt-1 text-sm text-slate-900">{appt.reminderSent ? "✓ Sent" : "Pending"}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-1 text-sm text-slate-900">{appt.status}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Consultation Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
              {appt.notes ? appt.notes : <span className="text-slate-400">No notes recorded.</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
