"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/Header";
import { StatCard } from "@/components/ui/Card";

type ReportData = {
  patients: {
    total: number;
    thisMonth: number;
    byGender: { gender: string; count: number }[];
  };
  appointments: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    missed: number;
    byStatus: { status: string; count: number }[];
    byMonth: { month: string; count: number }[];
  };
  sms: {
    total: number;
    sent: number;
    failed: number;
    byMonth: { month: string; count: number }[];
  };
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/reports?${params}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [from, to]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const missedRate = data?.appointments.total
    ? Math.round((data.appointments.missed / data.appointments.total) * 100)
    : 0;
  const smsSuccessRate = data?.sms.total
    ? Math.round((data.sms.sent / data.sms.total) * 100)
    : 0;

  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Operational overview across the facility" />

      {/* Date filters */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => { setFrom(""); setTo(""); }}
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50">
          Clear
        </button>
      </div>

      {loading ? (
        <p className="py-20 text-center text-sm text-slate-400">Loading report…</p>
      ) : data ? (
        <div className="space-y-8">
          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Patients" value={data.patients.total} sub={`+${data.patients.thisMonth} this month`} color="blue" icon={<UsersIcon />} />
            <StatCard label="Total Appointments" value={data.appointments.total} sub={`${data.appointments.completed} completed`} color="emerald" icon={<CalIcon />} />
            <StatCard label="Missed Rate" value={`${missedRate}%`} sub={`${data.appointments.missed} missed appointments`} color="rose" icon={<AlertIcon />} />
            <StatCard label="SMS Delivery Rate" value={`${smsSuccessRate}%`} sub={`${data.sms.sent} of ${data.sms.total} sent`} color="violet" icon={<MsgIcon />} />
          </div>

          {/* Appointment breakdown + Gender split */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Appointment status */}
            <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Appointments by Status</h3>
              <div className="space-y-3">
                {[
                  { label: "Scheduled", value: data.appointments.scheduled, color: "bg-blue-500" },
                  { label: "Completed", value: data.appointments.completed, color: "bg-emerald-500" },
                  { label: "Cancelled", value: data.appointments.cancelled, color: "bg-red-400" },
                  { label: "Missed", value: data.appointments.missed, color: "bg-amber-400" },
                ].map(({ label, value, color }) => {
                  const pct = data.appointments.total ? Math.round((value / data.appointments.total) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium text-slate-700">{label}</span>
                        <span className="text-slate-500">{value} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gender distribution */}
            <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Patients by Gender</h3>
              {data.patients.byGender.length === 0 ? (
                <p className="text-sm text-slate-400">No data available.</p>
              ) : (
                <div className="space-y-3">
                  {data.patients.byGender.map(({ gender, count }) => {
                    const pct = data.patients.total ? Math.round((count / data.patients.total) * 100) : 0;
                    const color = gender === "Male" ? "bg-blue-500" : gender === "Female" ? "bg-pink-400" : "bg-slate-400";
                    return (
                      <div key={gender}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium text-slate-700">{gender}</span>
                          <span className="text-slate-500">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100">
                          <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SMS delivery + monthly trend */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* SMS delivery */}
            <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">SMS Delivery Overview</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Total Sent", value: data.sms.total, color: "text-slate-900" },
                  { label: "Delivered", value: data.sms.sent, color: "text-emerald-600" },
                  { label: "Failed", value: data.sms.failed, color: "text-red-500" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg bg-slate-50 p-3">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              {data.sms.total > 0 && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Delivery rate</span>
                    <span>{smsSuccessRate}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-emerald-500 transition-all" style={{ width: `${smsSuccessRate}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Monthly appointments trend */}
            <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Monthly Appointments (Last 6 Months)</h3>
              {data.appointments.byMonth.length === 0 ? (
                <p className="text-sm text-slate-400">No data available.</p>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {[...data.appointments.byMonth].reverse().map(({ month, count }) => {
                    const max = Math.max(...data.appointments.byMonth.map((m) => m.count));
                    const pct = max ? (count / max) * 100 : 0;
                    return (
                      <div key={month} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-xs font-medium text-slate-700">{count}</span>
                        <div className="w-full rounded-t bg-blue-500 transition-all" style={{ height: `${Math.max(pct, 4)}%` }} />
                        <span className="text-xs text-slate-400">{month.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Missed appointments summary */}
          <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Key Takeaways</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                <span><strong>{data.patients.total}</strong> patients registered ({data.patients.thisMonth} new this month)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span>Appointment completion rate: <strong>{data.appointments.total ? Math.round((data.appointments.completed / data.appointments.total) * 100) : 0}%</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>Missed appointment rate: <strong>{missedRate}%</strong> ({data.appointments.missed} appointments missed)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                <span>SMS delivery rate: <strong>{smsSuccessRate}%</strong> ({data.sms.sent} messages delivered)</span>
              </li>
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UsersIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function CalIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function AlertIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
}
function MsgIcon() {
  return <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
}
