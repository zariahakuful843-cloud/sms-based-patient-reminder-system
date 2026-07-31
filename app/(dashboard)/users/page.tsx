"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";

type User = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [myRole, setMyRole] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", username: "", email: "", password: "", role: "RECEPTIONIST",
  });

  function fetchUsers() {
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : Array.isArray(d?.users) ? d.users : [];
        setUsers(list);
        setLoading(false);
      });
  }

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return;
      const session = (await res.json()) as { role?: string };
      setMyRole((session?.role ?? null) ? String(session?.role).toUpperCase() : null);
    })();
  }, []);

  useEffect(() => {
    if (myRole === "ADMIN") fetchUsers();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myRole]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Failed to create user."); return; }
    setSuccess(`User "${form.username}" created.`);
    setShowForm(false);
    setForm({ name: "", username: "", email: "", password: "", role: "RECEPTIONIST" });
    fetchUsers();
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete user "${name}"?`)) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchUsers();
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage staff accounts and roles"
        action={myRole === "ADMIN" ? (
          <Button size="sm" onClick={() => { setShowForm(!showForm); setSuccess(""); setError(""); }}>
            {showForm ? "Cancel" : "Add User"}
          </Button>
        ) : null}
      />

      {showForm && myRole === "ADMIN" && (
        <div className="mb-6 max-w-xl rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Create New Staff Account</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input id="name" label="Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ama Owusu" />
            <Input id="username" label="Username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. aowusu" />
            <Input id="email" label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. ama@ridgehospital.gh" />
            <Input id="password" label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
            <Select
              id="role"
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={[
                { value: "ADMIN", label: "Admin" },
                { value: "RECEPTIONIST", label: "Receptionist" },
                { value: "DOCTOR", label: "Doctor" },
                { value: "NURSE", label: "Nurse" },
              ]}
            />
            {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div className="flex gap-3">
              <Button type="submit" size="sm" loading={saving}>Create Account</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}


      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
          {success}
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Name", "Username", "Email", "Role", "Created", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">Loading…</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {u.name.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-slate-600">{u.username}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge
                    status={u.role}
                    label={
                      u.role === "ADMIN"
                        ? "Admin"
                        : u.role === "RECEPTIONIST"
                          ? "Receptionist"
                          : u.role === "DOCTOR"
                            ? "Doctor"
                            : u.role === "NURSE"
                              ? "Nurse"
                              : u.role
                    }
                  />
                </td>
                <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  {myRole === "ADMIN" ? (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/users/${u.id}`}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        View
                      </Link>
                      <Link
                        href={`/users/${u.id}/edit`}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <span />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
