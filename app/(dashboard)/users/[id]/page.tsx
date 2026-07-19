"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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

export default function UserViewPage() {
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    fetch(`/api/users/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => null);
          throw new Error(data?.error ?? `Failed to fetch user (${r.status})`);
        }
        return r.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load user");
        setLoading(false);
      });
  }, [id]);

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

  const roleLabel =
    user.role === "ADMIN"
      ? "Admin"
      : user.role === "RECEPTIONIST"
        ? "Receptionist"
        : user.role === "DOCTOR"
          ? "Doctor"
          : user.role === "NURSE"
            ? "Nurse"
            : String(user.role);

  return (
    <div>
      <PageHeader
        title="User"
        description={`Manage staff account details for ${user.name}`}
        action={
          <div className="flex gap-2">
            <Link href="/users">
              <Button variant="secondary" size="sm">
                Back
              </Button>
            </Link>
            <Link href={`/users/${user.id}/edit`}>
              <Button size="sm">Edit</Button>
            </Link>
          </div>
        }
      />

      <div className="mx-auto max-w-2xl rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="mt-1 text-sm text-slate-500">{user.username}</p>
            </div>
            <Badge status={user.role} label={roleLabel} />
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 ring-1 ring-slate-200 p-4">
              <dt className="text-xs font-medium text-slate-500">Email</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900 break-words">{user.email}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 ring-1 ring-slate-200 p-4">
              <dt className="text-xs font-medium text-slate-500">Created</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(user.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

