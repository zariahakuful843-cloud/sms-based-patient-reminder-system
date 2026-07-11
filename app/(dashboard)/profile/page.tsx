"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/Header";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

type Profile = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string | null;
  department: string | null;
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-900">{children}</span>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile" description="Your account details" />

      <Card>
        <CardHeader title="Account Information" />
        <CardContent>
          {loading || !profile ? (
            <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">{profile.name}</p>
                  <p className="text-sm text-slate-500">@{profile.username}</p>
                </div>
              </div>

              <Row label="Full Name">{profile.name}</Row>
              <Row label="Username">{profile.username}</Row>
              <Row label="Email">{profile.email}</Row>
              <Row label="Role">
                <Badge status={profile.role} label={profile.role} />
              </Row>
              <Row label="Department">{profile.department ?? "—"}</Row>
              <Row label="Account Status">
                <Badge
                  status={profile.active ? "ACTIVE" : "INACTIVE"}
                  label={profile.active ? "Active" : "Inactive"}
                />
              </Row>
              <Row label="Date Created">
                {profile.createdAt ? formatDate(profile.createdAt) : "—"}
              </Row>

              <div className="mt-6">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => alert("Change password coming soon.")}
                >
                  Change Password
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
