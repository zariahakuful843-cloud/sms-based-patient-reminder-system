"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

function HealthcareIcon() {
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

function FloatingGraphic() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Soft healthcare gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-teal-500/10 to-indigo-600/10" />

      {/* Floating blobs */}
      <div className="absolute -left-10 top-14 h-36 w-36 rounded-full bg-blue-500/15 blur-2xl" />
      <div className="absolute -right-10 top-28 h-44 w-44 rounded-full bg-teal-500/15 blur-2xl" />
      <div className="absolute bottom-8 left-20 h-28 w-28 rounded-full bg-indigo-500/15 blur-2xl" />

      {/* Illustration card */}
      <div className="relative mx-auto mt-10 max-w-md rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-200 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <HealthcareIcon />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Automated SMS workflows</p>
            <p className="text-xs text-slate-500">Appointments, follow-ups, reminders—handled.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg bg-blue-50 p-2 text-blue-700">
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12h18" />
                  <path d="M12 3v18" />
                  <rect x="6" y="6" width="12" height="12" rx="2" ry="2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Scheduling</p>
                <p className="mt-1 text-xs text-slate-500">Capture appointments and patient preferences.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg bg-emerald-50 p-2 text-emerald-700">
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-6l-2 2h-4l-2-2H2" />
                  <path d="M21 10V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
                  <path d="M5 21h14a2 2 0 0 0 2-2v-3" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Reminders</p>
                <p className="mt-1 text-xs text-slate-500">Reduce missed visits with timely SMS alerts.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg bg-indigo-50 p-2 text-indigo-700">
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20" />
                  <path d="M2 12h20" />
                  <path d="M7 7l10 10" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Follow-up</p>
                <p className="mt-1 text-xs text-slate-500">Stay connected across care pathways.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-blue-500/40 via-teal-500/30 to-indigo-500/40" />
    </div>
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
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Invalid credentials. Please try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Page fade-in */}
      <div className="animate-[fadeIn_420ms_ease-out_forwards]">
        <div className="mx-auto min-h-screen max-w-7xl px-4">
          <div className="grid min-h-screen items-center gap-8 py-10 md:grid-cols-[55%_45%] md:py-0">
            {/* LEFT */}
            <section className="relative order-1 md:order-none">
              <div className="flex h-full flex-col justify-center">
                <div className="max-w-xl">
                  <p className="text-sm font-semibold text-blue-700">SMS Patient Reminder System</p>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    Automated Patient Reminders Made Simple
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                    Reduce missed appointments and improve patient follow-up through automated SMS reminders.
                  </p>
                </div>

                <div className="mt-8">
                  <FloatingGraphic />
                </div>
              </div>
            </section>

            {/* RIGHT */}
            <section className="order-0 md:order-none">
              <div className="flex w-full justify-center">
                <div className="w-full max-w-md">
                  <Card className="rounded-2xl shadow-xl ring-0">
                    <div className="px-5 py-7 sm:px-8 sm:py-9">
                      {/* Logo */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                          <HealthcareIcon />
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-900">SMS Patient Reminder System</p>
                          <p className="text-xs text-slate-500">Healthcare Administration</p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h2 className="text-xl font-semibold text-slate-900">Welcome Back</h2>
                        <p className="mt-1 text-sm text-slate-600">Sign in to access your dashboard</p>
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

                        {/* Remember me + Error */}
                        <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
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

                      <div className="mt-6 text-xs text-slate-500">
                        <p className="font-semibold text-slate-700">Helping healthcare facilities improve patient communication.</p>
                      </div>
                    </div>
                  </Card>

                  <p className="mt-4 text-center text-xs text-slate-400">
                    © {new Date().getFullYear()} SMS Patient Reminder System
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

