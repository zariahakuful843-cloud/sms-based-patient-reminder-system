"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";

type Role = "ADMIN" | "RECEPTIONIST" | "DOCTOR" | "NURSE";

type User = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: Role | string;
  createdAt: string;
};

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [myRole, setMyRole] = useState<Role | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = myRole === "ADMIN";

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "RECEPTIONIST" as Role,
  });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return;
      const session = (await res.json()) as { role?: string };
      const detected = (session?.role ?? "").trim().toUpperCase();
      if (
        detected === "ADMIN" ||
        detected === "RECEPTIONIST" ||
        detected === "DOCTOR" ||
        detected === "NURSE"
      ) {
        setMyRole(detected as Role);
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/users/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to fetch user");
        return r.json();
      })
      .then((data: User) => {
        setUser(data);
        setForm({
          name: data.name ?? "",
          username: data.username ?? "",
          email: data.email ?? "",
          password: "",
          role:
            (data.role === "ADMIN" || data.role === "RECEPTIONIST" || data.role === "DOCTOR" || data.role === "NURSE"
              ? (data.role as Role)
              : "RECEPTIONIST") ?? "RECEPTIONIST",
        });
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load user");
        setLoading(false);
      });
  }, [id]);

  const roleOptions = useMemo(
    () => [
      { value: "ADMIN", label: "Admin" },
      { value: "RECEPTIONIST", label: "Receptionist" },
      { value: "DOCTOR", label: "Doctor" },
      { value: "NURSE", label: "Nurse" },
    ],
    []
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data?.error ?? "Failed to update user.");
      return;
    }

    router.push(`/users/${id}`);
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-400">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-500">{error || "User not found."}</p>
        <div className="mt-4">
          <Link href="/users">
            <Button variant="secondary" size="sm">
              Back to Users
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit User"
        description={`Editing ${user.name} (created ${formatDate(user.createdAt)})`}
        action={
          <div className="flex gap-2">
            <Link href="/users">
              <Button variant="secondary" size="sm">
                Back
              </Button>
            </Link>
          </div>
        }
      />

      {!isAdmin && (
        <div className="mb-4 rounded-xl bg-red-50 ring-1 ring-red-200 p-4 text-sm text-red-700">
          Only ADMIN can edit users.
        </div>
      )}

      <div className="mx-auto max-w-2xl rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="name"
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={!isAdmin || saving}
            />
            <Input
              id="username"
              label="Username"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              disabled={!isAdmin || saving}
            />
          </div>

          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={!isAdmin || saving}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Leave blank to keep existing password"
            disabled={!isAdmin || saving}
          />

          <Select
            id="role"
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            options={roleOptions}
            disabled={!isAdmin || saving}
          />

          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex gap-3">
            <Button type="submit" loading={saving} disabled={!isAdmin}>
              Save
            </Button>
            <Link href={`/users/${user.id}`}>
              <Button type="button" variant="secondary" disabled={saving}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

