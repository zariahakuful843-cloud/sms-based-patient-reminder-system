"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  formatDate,
  formatDateTime,
  calculateAge,
} from "@/lib/utils";

type Role = "ADMIN" | "MEDICAL_RECORDS_OFFICER" | "NURSE" | "DOCTOR";

type Doctor = {
  id: number;
  name: string;
};

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

  doctor?: {
    id: number;
    name: string;
  } | null;

  appointments: Appointment[];
  smsLogs: SMSLog[];
};

export default function PatientDetailPage() {
  const [role, setRole] = useState<Role | null>(null);

  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [patient, setPatient] = useState<Patient | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
    doctorId: "",
  });

  /*
   * Get the logged-in user's role.
   */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!res.ok) {
          setRole(null);
          return;
        }

        const session = (await res.json()) as {
          role?: string;
        };

        const detected = (
          session?.role ?? "ANONYMOUS"
        )
          .trim()
          .toUpperCase();

        if (
          detected === "ADMIN" ||
          detected === "MEDICAL_RECORDS_OFFICER" ||
          detected === "NURSE" ||
          detected === "DOCTOR"
        ) {
          setRole(detected as Role);
        } else {
          setRole(null);
        }
      } catch {
        setRole(null);
      }
    })();
  }, []);

  /*
   * Load the patient.
   */
  useEffect(() => {
    if (!id) return;

    fetch(`/api/patients/${id}`)
      .then(async (r) => {
        const data = await r.json();

        if (!r.ok) {
          throw new Error(
            data.error || "Failed to load patient."
          );
        }

        return data;
      })
      .then((data) => {
        setPatient(data);

        setForm({
          fullName: data.fullName ?? "",
          gender: data.gender ?? "",
          phoneNumber: data.phoneNumber ?? "",
          address: data.address ?? "",
          dateOfBirth:
            data.dateOfBirth?.split("T")[0] ?? "",
          doctorId: data.doctor?.id
            ? String(data.doctor.id)
            : "",
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setPatient(null);
        setLoading(false);
      });
  }, [id]);

  /*
   * Load doctors when the receptionist opens Edit.
   */
  useEffect(() => {
    if (!editing || role !== "MEDICAL_RECORDS_OFFICER") {
      return;
    }

    async function loadDoctors() {
      setLoadingDoctors(true);

      try {
        const res = await fetch(
          "/api/users?role=DOCTOR&limit=100"
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error || "Failed to load doctors."
          );
        }

        setDoctors(data.users ?? []);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load doctors."
        );
      } finally {
        setLoadingDoctors(false);
      }
    }

    loadDoctors();
  }, [editing, role]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ?? "Failed to update patient."
        );
        return;
      }

      setPatient((current) =>
        current
          ? {
              ...current,
              ...data,
            }
          : null
      );

      setEditing(false);
    } catch {
      setError("Unable to update patient.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete patient "${patient?.fullName}"? This will also remove all appointments and SMS logs.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/patients/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const data = await res.json();

        alert(
          data.error ?? "Failed to delete patient."
        );

        return;
      }

      router.push("/patients");
    } catch {
      alert("Unable to delete patient.");
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">
        Patient not found.
      </div>
    );
  }

  /*
   * MEDICAL RECORDS OFFICER:
   * Can edit patient information and assign/reassign a doctor.
   * Cannot schedule appointments.
   *
   * Doctor:
   * Can schedule follow-up appointments.
   * Cannot edit patient information here.
   *
   * Admin:
   * Can delete patients.
   */
  const canEditPatient = role === "MEDICAL_RECORDS_OFFICER";
  const canDeletePatient = role === "ADMIN";
  const canScheduleAppointment = role === "DOCTOR";

  /*
   * SMS history is handled on the SMS & Reminders page.
   */
  const showSmsHistory = false;

  function formatDoctorName(doctorName: string) {
    const name = (doctorName ?? "").trim();

    if (!name) {
      return "Not assigned";
    }

    const withoutPrefix = name.replace(
      /^\s*dr\.\s*/i,
      ""
    );

    return `Dr. ${withoutPrefix}`.trim();
  }

  const doctorOptions = [
    {
      value: "",
      label: loadingDoctors
        ? "Loading doctors..."
        : "Select a doctor...",
    },
    ...doctors.map((doctor) => ({
      value: String(doctor.id),
      label: formatDoctorName(doctor.name),
    })),
  ];

  return (
    <div>
      <PageHeader
        title={patient.fullName}
        description={`Patient ID: #${patient.id} · Registered ${formatDate(
          patient.createdAt
        )}`}
        action={
          <div className="flex gap-2">
            {canScheduleAppointment && (
              <Link
                href={`/appointments/new?patientId=${patient.id}`}
              >
                <Button
                  size="sm"
                  variant="secondary"
                >
                  Schedule Appointment
                </Button>
              </Link>
            )}

            {canEditPatient && (
              <Button
                size="sm"
                onClick={() => {
                  setError("");
                  setEditing(!editing);
                }}
              >
                {editing
                  ? "Cancel Edit"
                  : "Edit"}
              </Button>
            )}

            {canDeletePatient && (
              <Button
                size="sm"
                variant="danger"
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient information */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                {patient.fullName.charAt(0)}
              </div>

              <h2 className="text-lg font-bold">
                {patient.fullName}
              </h2>

              <p className="text-sm text-blue-100">
                {patient.phoneNumber}
              </p>
            </div>

            {editing ? (
              <form
                onSubmit={handleSave}
                className="space-y-4 p-5"
              >
                <Input
                  id="fullName"
                  label="Full Name"
                  required
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fullName: e.target.value,
                    })
                  }
                />

                <Select
                  id="gender"
                  label="Gender"
                  value={form.gender}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      gender: e.target.value,
                    })
                  }
                  options={[
                    {
                      value: "Male",
                      label: "Male",
                    },
                    {
                      value: "Female",
                      label: "Female",
                    },
                    {
                      value: "Other",
                      label: "Other",
                    },
                  ]}
                />

                <Input
                  id="phone"
                  label="Phone"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phoneNumber: e.target.value,
                    })
                  }
                />

                <Input
                  id="dob"
                  label="Date of Birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dateOfBirth: e.target.value,
                    })
                  }
                />

                <Textarea
                  id="address"
                  label="Address"
                  rows={2}
                  value={form.address}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: e.target.value,
                    })
                  }
                />

                {/* Assign doctor */}
                <Select
                  id="doctorId"
                  label="Assigned Doctor"
                  value={form.doctorId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      doctorId: e.target.value,
                    })
                  }
                  options={doctorOptions}
                  disabled={
                    loadingDoctors ||
                    doctors.length === 0
                  }
                />

                {doctors.length === 0 &&
                  !loadingDoctors && (
                    <p className="text-xs text-red-600">
                      No doctors are currently available.
                    </p>
                  )}

                {error && (
                  <p className="text-xs text-red-600">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  size="sm"
                  loading={saving}
                  disabled={
                    loadingDoctors ||
                    doctors.length === 0
                  }
                >
                  Save Changes
                </Button>
              </form>
            ) : (
              <dl className="divide-y divide-slate-100 px-5 py-3 text-sm">
                {[
                  {
                    label: "Gender",
                    value: patient.gender,
                  },
                  {
                    label: "Date of Birth",
                    value: `${formatDate(
                      patient.dateOfBirth
                    )} (${calculateAge(
                      patient.dateOfBirth
                    )} yrs)`,
                  },
                  {
                    label: "Phone",
                    value: patient.phoneNumber,
                  },
                  {
                    label: "Address",
                    value: patient.address,
                  },
                  {
                    label: "Assigned Doctor",
                    value: patient.doctor
                      ? formatDoctorName(
                          patient.doctor.name
                        )
                      : "Not assigned",
                  },
                ].map(
                  ({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between gap-4 py-2.5"
                    >
                      <dt className="text-slate-500">
                        {label}
                      </dt>

                      <dd className="text-right text-slate-900">
                        {value}
                      </dd>
                    </div>
                  )
                )}
              </dl>
            )}
          </div>
        </div>

        {/* Appointments */}
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Appointments (
                {patient.appointments.length}
                )
              </h3>

              {canScheduleAppointment && (
                <Link
                  href={`/appointments/new?patientId=${patient.id}`}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  + New
                </Link>
              )}
            </div>

            {patient.appointments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                No appointments yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {patient.appointments.map(
                  (a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDoctorName(
                            a.doctorName
                          )}
                        </p>

                        <p className="text-xs text-slate-500">
                          {formatDateTime(
                            a.appointmentDate
                          )}
                        </p>
                      </div>

                      <Badge status={a.status} />
                    </li>
                  )
                )}
              </ul>
            )}
          </div>

          {/* SMS history is intentionally hidden here.
              SMS history is managed from the SMS & Reminders page. */}
          {showSmsHistory && (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  SMS History (
                  {patient.smsLogs.length}
                  )
                </h3>
              </div>

              {patient.smsLogs.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  No SMS sent yet.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {patient.smsLogs.map(
                    (s) => (
                      <li
                        key={s.id}
                        className="px-5 py-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="flex-1 text-sm text-slate-700">
                            {s.message}
                          </p>

                          <div className="shrink-0 text-right">
                            <Badge
                              status={s.status}
                            />

                            <p className="mt-1 text-xs text-slate-400">
                              {formatDateTime(
                                s.sentAt
                              )}
                            </p>
                          </div>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
