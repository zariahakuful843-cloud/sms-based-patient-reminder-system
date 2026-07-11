"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { homeFor } from "@/lib/rbac";

function MedicalIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function EyeIcon({ open, className }: { open: boolean; className?: string }) {
  return open ? (
    <svg
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58a3 3 0 0 0 4.24 4.24" />
      <path d="M9.88 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a20.5 20.5 0 0 1-4.25 5.23" />
      <path d="M6.11 6.11C3.62 8.4 2 12 2 12s3.5 7 10 7c1.12 0 2.17-.2 3.13-.58" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const usernameId = useMemo(() => "username", []);
  const passwordId = useMemo(() => "password", []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.username.trim() || !form.password) {
      setError("Please enter both your username and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid credentials. Please try again.");
        return;
      }

      // Redirect to the dashboard that matches the authenticated user's role.
      router.push(homeFor(data.role));
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen bg-gradient-to-b from-[#F8FAFC] via-white to-[#F8FAFC] px-4"
      aria-label="Login"
    >
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center">
        <div className="w-full max-w-[400px]">
          <div className="animate-[fadeIn_420ms_ease-out_forwards]">
            <Card className="rounded-2xl border-slate-200 shadow-lg">
              <div className="p-6 sm:p-7">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                    <MedicalIcon />
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-bold text-slate-900">SMS Patient Reminder System</h1>
                    <p className="mt-0.5 text-xs text-slate-500">Sign in to manage appointments and patient reminders.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  {/* Username */}
                  <div className="space-y-1.5">
                    <label htmlFor={usernameId} className="text-sm font-medium text-slate-700">
                      Username
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <UserIcon className="h-5 w-5" />
                      </span>
                      <Input
                        id={usernameId}
                        type="text"
                        autoComplete="username"
                        required
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        placeholder="Enter your username"
                        className="h-11 pl-10"
                        aria-describedby={error ? "login-error" : undefined}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label htmlFor={passwordId} className="text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <LockIcon className="h-5 w-5" />
                      </span>

                      <Input
                        id={passwordId}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Enter your password"
                        className="h-11 pl-10 pr-12"
                        aria-describedby={error ? "login-error" : undefined}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute inset-y-0 right-3 inline-flex items-center rounded-md px-2 text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <EyeIcon open={showPassword} className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Remember + Error */}
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Remember me
                    </label>

                    {error && (
                      <div
                        id="login-error"
                        role="alert"
                        className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200"
                      >
                        {error}
                      </div>
                    )}
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                    className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold"
                  >
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                </form>

                <p className="mt-6 text-center text-xs text-slate-500">
                  Helping healthcare facilities improve patient communication.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}


