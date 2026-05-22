"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  phoneNumber: string;
  gender: string | null;
  dateOfBirth: string | null;
  notes: string | null;
  appointments: Array<{
    id: string;
    appointmentDate: string;
    type: string | null;
    status: string;
  }>;
  messages: Array<{
    id: string;
    content: string;
    status: string;
    createdAt: string;
  }>;
}

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/patients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPatient(data);
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      dateOfBirth: (formData.get("dateOfBirth") as string) || null,
      gender: (formData.get("gender") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    const res = await fetch(`/api/patients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update");
    }
    setSaving(false);
    router.refresh();
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!patient) return <div className="p-8 text-center">Patient not found</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patients" className="rounded-lg p-2 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{patient.name}</h1>
          <p className="text-sm text-slate-500">{patient.phoneNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl bg-white p-5 shadow-sm lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-slate-800">
            Patient Details
          </h3>
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                name="name"
                defaultValue={patient.name}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                name="phoneNumber"
                defaultValue={patient.phoneNumber}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Date of Birth
              </label>
              <input
                name="dateOfBirth"
                type="date"
                defaultValue={
                  patient.dateOfBirth
                    ? new Date(patient.dateOfBirth).toISOString().split("T")[0]
                    : ""
                }
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Gender
              </label>
              <select
                name="gender"
                defaultValue={patient.gender || ""}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              name="notes"
              defaultValue={patient.notes || ""}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Appointments ({patient.appointments.length})
            </h3>
            {patient.appointments.length === 0 ? (
              <p className="text-xs text-slate-500">No appointments</p>
            ) : (
              <div className="space-y-2">
                {patient.appointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="rounded border p-2 text-xs">
                    <p className="font-medium">
                      {new Date(apt.appointmentDate).toLocaleDateString()}
                    </p>
                    <p className="text-slate-500">
                      {apt.type} • {apt.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
