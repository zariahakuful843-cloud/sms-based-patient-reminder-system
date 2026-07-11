"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/Header";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

type Department = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  active: boolean;
  _count: { users: number; appointments: number };
};

type FormState = { id: number | null; name: string; code: string; description: string };
const EMPTY: FormState = { id: null, name: "", code: "", description: "" };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/departments");
    const data = await res.json();
    setDepartments(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  }

  function openEdit(d: Department) {
    setForm({ id: d.id, name: d.name, code: d.code, description: d.description ?? "" });
    setError("");
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    setError("");
    const isEdit = form.id !== null;
    const res = await fetch(isEdit ? `/api/departments/${form.id}` : "/api/departments", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, code: form.code, description: form.description }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to save department.");
      return;
    }
    setShowForm(false);
    load();
  }

  async function toggleActive(d: Department) {
    await fetch(`/api/departments/${d.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !d.active }),
    });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Department Management"
        description={`${departments.length} department${departments.length !== 1 ? "s" : ""}`}
        action={
          <Button size="sm" onClick={openCreate}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Department
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader title={form.id ? "Edit Department" : "Create Department"} />
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Department Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Department Code"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="mt-4">
              <Input
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={save} loading={saving}>
                {form.id ? "Save Changes" : "Create"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Name", "Code", "Description", "Staff", "Appointments", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-400">Loading…</td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-400">No departments yet.</td>
              </tr>
            ) : (
              departments.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{d.code}</td>
                  <td className="px-4 py-3 text-slate-500">{d.description ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{d._count.users}</td>
                  <td className="px-4 py-3 text-slate-600">{d._count.appointments}</td>
                  <td className="px-4 py-3">
                    <Badge status={d.active ? "ACTIVE" : "INACTIVE"} label={d.active ? "Active" : "Inactive"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(d)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(d)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        {d.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
