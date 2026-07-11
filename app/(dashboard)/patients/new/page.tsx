"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useCan } from "@/lib/session-context";

export default function NewPatientPage() {
  const router = useRouter();
  const canCreate = useCan()("patients.create");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    gender: "Male",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to register patient.");
      return;
    }

    router.push(`/patients/${data.id}`);
  }

  if (!canCreate) {
    return (
      <div>
        <PageHeader title="Register Patient" description="You do not have permission to register patients." />
        <p className="text-sm text-slate-500">Only reception staff can register new patients.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Register New Patient"
        description="Fill in the patient details below"
        action={
          <Link href="/patients">
            <Button variant="secondary" size="sm">Cancel</Button>
          </Link>
        }
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                id="fullName"
                label="Full Name"
                required
                placeholder="e.g. Kwame Asante"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
              />
            </div>
            <Select
              id="gender"
              label="Gender"
              required
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Other", label: "Other" },
              ]}
            />
            <Input
              id="dateOfBirth"
              label="Date of Birth"
              type="date"
              required
              value={form.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
            <div className="sm:col-span-2">
              <Input
                id="phoneNumber"
                label="Phone Number"
                type="tel"
                required
                placeholder="e.g. 0244123456"
                value={form.phoneNumber}
                onChange={(e) => set("phoneNumber", e.target.value)}
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
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              Register Patient
            </Button>
            <Link href="/patients">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
