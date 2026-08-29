"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";

type Doctor = {
  id: number;
  name: string;
};

export default function NewPatientPage() {
  const router = useRouter();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    gender: "Male",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
    doctorId: "",
  });

  useEffect(() => {
    async function loadDoctors() {
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
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load doctors."
        );
      } finally {
        setLoadingDoctors(false);
      }
    }

    loadDoctors();
  }, []);

  function set(field: string, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    if (!form.doctorId) {
      setError("Please select a doctor.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ?? "Failed to register patient."
        );
        setLoading(false);
        return;
      }

      router.push(`/patients/${data.id}`);
    } catch {
      setError("Unable to register patient.");
    } finally {
      setLoading(false);
    }
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
      label: doctor.name,
    })),
  ];

  return (
    <div>
      <PageHeader
        title="Register New Patient"
        description="Register the patient and assign them to a doctor"
        action={
          <Link href="/patients">
            <Button variant="secondary" size="sm">
              Cancel
            </Button>
          </Link>
        }
      />

      <div className="max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                id="fullName"
                label="Full Name"
                required
                placeholder="e.g. Kwame Asante"
                value={form.fullName}
                onChange={(e) =>
                  set("fullName", e.target.value)
                }
              />
            </div>

            <Select
              id="gender"
              label="Gender"
              required
              value={form.gender}
              onChange={(e) =>
                set("gender", e.target.value)
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
              id="dateOfBirth"
              label="Date of Birth"
              type="date"
              required
              value={form.dateOfBirth}
              onChange={(e) =>
                set("dateOfBirth", e.target.value)
              }
            />

            <div className="sm:col-span-2">
              <Input
                id="phoneNumber"
                label="Phone Number"
                type="tel"
                required
                placeholder="e.g. 0244123456"
                value={form.phoneNumber}
                onChange={(e) =>
                  set("phoneNumber", e.target.value)
                }
              />
            </div>

            <div className="sm:col-span-2">
              <Textarea
                id="address"
                label="Address"
                required
                rows={3}
                placeholder="e.g. 12 Ring Road, Accra"
                value={form.address}
                onChange={(e) =>
                  set("address", e.target.value)
                }
              />
            </div>

            <div className="sm:col-span-2">
              <Select
                id="doctorId"
                label="Assigned Doctor"
                required
                value={form.doctorId}
                onChange={(e) =>
                  set("doctorId", e.target.value)
                }
                options={doctorOptions}
                disabled={
                  loadingDoctors || doctors.length === 0
                }
              />

              {doctors.length === 0 &&
                !loadingDoctors && (
                  <p className="mt-1 text-xs text-red-600">
                    No doctors are currently available.
                  </p>
                )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              loading={loading}
              disabled={
                loadingDoctors || doctors.length === 0
              }
            >
              Register Patient
            </Button>

            <Link href="/patients">
              <Button
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
