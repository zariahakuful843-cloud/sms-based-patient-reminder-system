"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

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

type ReportType = "ALL" | "SMS" | "APPOINTMENTS" | "PATIENTS";

type KpiDelta = { current: number; previous: number; pct: number };

function parseDateInput(value: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toYMD(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function computeDelta(current: number, previous: number): KpiDelta {
  const prev = previous || 0;
  const pct = prev === 0 ? 0 : Math.round(((current - prev) / prev) * 100);
  return { current, previous, pct };
}

function deltaText(delta: KpiDelta) {
  if (delta.previous === 0) return "vs previous: —";
  const sign = delta.pct >= 0 ? "+" : "";
  return `vs previous: ${sign}${delta.pct}%`;
}

function StatusPill({ label, tone }: { label: string; tone: "green" | "orange" | "red" | "blue" }) {
  const map = {
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    orange: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    red: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${map[tone]}`}>{label}</span>
  );
}

function LineChart({
  labels,
  series,
}: {
  labels: string[];
  series: { name: string; values: number[]; color: string }[];
}) {
  const height = 240;
  const width = 720;
  const padding = 28;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const allVals = series.flatMap((s) => s.values);
  const maxVal = Math.max(1, ...allVals);

  const xFor = (i: number, n: number) => padding + innerW * (n <= 1 ? 0 : i / (n - 1));
  const yFor = (v: number) => padding + innerH * (1 - v / maxVal);

  const gridLines = 4;
  const yTicks = Array.from({ length: gridLines + 1 }, (_, i) => i);

  const toPath = (values: number[]) => {
    const n = values.length;
    return values
      .map((v, i) => {
        const x = xFor(i, n);
        const y = yFor(v);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  };

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="SMS performance line chart">
        <rect x="0" y="0" width={width} height={height} fill="transparent" />

        {yTicks.map((i) => {
          const y = padding + (innerH * i) / gridLines;
          return <line key={i} x1={padding} y1={y} x2={padding + innerW} y2={y} stroke="rgba(148,163,184,0.25)" strokeWidth="1" />;
        })}

        {yTicks.map((i) => {
          const val = Math.round(maxVal * (1 - i / gridLines));
          const y = padding + (innerH * i) / gridLines;
          return (
            <text key={`yl-${i}`} x={8} y={y + 4} fontSize="11" fill="rgba(100,116,139,0.85)">
              {val}
            </text>
          );
        })}

        {series.map((s) => {
          return (
            <g key={s.name}>
              <path d={toPath(s.values)} fill="none" stroke={s.color} strokeWidth="2.5" />
              {s.values.map((v, i) => {
                return <circle key={i} cx={xFor(i, s.values.length)} cy={yFor(v)} r={3.5} fill={s.color} />;
              })}
            </g>
          );
        })}

        {labels.map((lab, i) => {
          const show = labels.length <= 6 ? true : i % 2 === 0;
          if (!show) return null;
          return (
            <text key={lab} x={xFor(i, labels.length)} y={height - 10} textAnchor="middle" fontSize="11" fill="rgba(100,116,139,0.85)">
              {lab}
            </text>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="font-medium text-slate-700">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChartSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="h-[220px] w-[220px] animate-pulse rounded-full bg-slate-100 ring-1 ring-slate-200" />
      <div className="h-4 w-48 animate-pulse rounded bg-slate-100 ring-1 ring-slate-200" />
      <div className="h-3 w-64 animate-pulse rounded bg-slate-100 ring-1 ring-slate-200" />
    </div>
  );
}

function ChartSkeletonBlock() {
  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-56 animate-pulse rounded bg-slate-100 ring-1 ring-slate-200" />
          <div className="h-3 w-72 animate-pulse rounded bg-slate-100 ring-1 ring-slate-200" />
        </div>
        <div className="h-10 w-20 animate-pulse rounded bg-slate-100 ring-1 ring-slate-200" />
      </div>
      <div className="mt-6 h-[240px] w-full animate-pulse rounded-lg bg-slate-100 ring-1 ring-slate-200" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
        <div className="space-y-2">
          <div className="h-4 w-56 animate-pulse rounded bg-slate-100 ring-1 ring-slate-200" />
          <div className="h-3 w-64 animate-pulse rounded bg-slate-100 ring-1 ring-slate-200" />
        </div>
        <div className="h-9 w-40 animate-pulse rounded bg-slate-100 ring-1 ring-slate-200" />
      </div>
      <div className="px-6 py-4">
        <div className="h-11 w-full animate-pulse rounded bg-slate-100 ring-1 ring-slate-200" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded bg-slate-100 ring-1 ring-slate-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 5.2 8.38 8.38 0 0 1-3.8-.9L3 21l.7-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 5.2-7.6 8.38 8.38 0 0 1 3.8-.9 8.5 8.5 0 0 1 8.5 8.5z" />
          </svg>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
const EMPTY_REPORT: ReportData = {
  patients: {
    total: 0,
    thisMonth: 0,
    byGender: [],
  },
  appointments: {
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    missed: 0,
    byStatus: [],
    byMonth: [],
  },
  sms: {
    total: 0,
    sent: 0,
    failed: 0,
    byMonth: [],
  },
};
export default function ReportsPage() {
  const [data, setData] = useState<ReportData>(EMPTY_REPORT);
  const [previous, setPrevious] = useState<ReportData>(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reportType, setReportType] = useState<ReportType>("ALL");

  const fetchReport = useCallback(async (range: { from?: string; to?: string }) => {
    const params = new URLSearchParams();
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);

    const res = await fetch(`/api/reports?${params.toString()}`);
    const d = (await res.json()) as ReportData;
    return d;
  }, []);

  const applyFilters = useCallback(async () => {
    setLoading(true);

    const fromDate = parseDateInput(from);
    const toDate = parseDateInput(to);

    const currentRange = {
      from: fromDate ? toYMD(fromDate) : undefined,
      to: toDate ? toYMD(toDate) : undefined,
    };

    // Previous period for deltas: shift by the same number of days.
    let prevRange: { from?: string; to?: string } = {};
    if (fromDate && toDate) {
      const days = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const prevTo = addDays(toDate, -days);
      const prevFrom = addDays(prevTo, -(days - 1));
      prevRange = { from: toYMD(prevFrom), to: toYMD(prevTo) };
    }

    try {
      const [cur, prev] = await Promise.all([
        fetchReport(currentRange),
        Object.keys(prevRange).length ? fetchReport(prevRange) : fetchReport({}),
      ]);

      setData(cur);
      setPrevious(prev);
    } catch {
      setData(EMPTY_REPORT);
      setPrevious(EMPTY_REPORT);
    } finally {
      setLoading(false);
    }
  }, [fetchReport, from, to]);

  useEffect(() => {
    applyFilters();
  }, []); // initial

  const visible = useMemo(() => {
  return data;
}, [data]);

 const kpis = useMemo(() => {
  const smsSent = computeDelta(data.sms.total, previous.sms.total);

  const delivered = computeDelta(
    data.sms.sent,
    previous.sms.sent
  );

  const failed = computeDelta(
    data.sms.failed,
    previous.sms.failed
  );

  const pending = computeDelta(
    Math.max(0, data.sms.total - data.sms.sent),
    Math.max(0, previous.sms.total - previous.sms.sent)
  );

  const patients = computeDelta(
    data.patients.total,
    previous.patients.total
  );

  return {
    smsSent,
    delivered,
    failed,
    pending,
    patients,
  };
}, [data, previous]);

  const smsSeries = useMemo(() => {
    if (!data) return null;

    // We only have total/sent/failed totals and a byMonth for SMSLog count.
    // Use byMonth as "Sent" baseline; split into delivered/failed by proportions.
    const months = data.sms.byMonth.map((m) => m.month);
    const vals = data.sms.byMonth.map((m) => m.count);

    const sentTotal = data.sms.sent;
    const failedTotal = data.sms.failed;
    const total = data.sms.total;

    const deliveredFrac = total ? sentTotal / total : 0;
    const failedFrac = total ? failedTotal / total : 0;

    const deliveredVals = vals.map((v) => Math.round(v * deliveredFrac));
    const failedVals = vals.map((v) => Math.round(v * failedFrac));
    const pendingVals = vals.map((v) => Math.max(0, v - Math.round(v * deliveredFrac)));

    return {
      labels: months.map((m) => m.slice(5)),
      series: [
        { name: "Sent", values: vals, color: "#2563EB" },
        { name: "Delivered", values: deliveredVals, color: "#059669" },
        { name: "Failed", values: failedVals, color: "#E11D48" },
        // Pending included in KPI only (chart stays on requested Sent/Delivered/Failed)
        // pendingSeries is computed if needed.
        // { name: "Pending", values: pendingVals, color: "#D97706" },
      ],
      pendingVals,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Operational overview across the facility"
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                // UI-only export: backend integration intentionally not added.
                // This keeps backend logic unchanged.
                window.alert("Export is available in a later step. UI only for now.");
              }}
            >
              Export Report
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
            <div className="w-full sm:w-auto">
              <label className="text-xs font-medium text-slate-600">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10" />
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-xs font-medium text-slate-600">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10" />
            </div>

            <div className="w-full sm:w-auto">
              <label className="text-xs font-medium text-slate-600">Report type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="h-10 w-full sm:w-64 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Reports</option>
                <option value="SMS">SMS</option>
                <option value="APPOINTMENTS">Appointments</option>
                <option value="PATIENTS">Patients</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button variant="primary" size="md" loading={loading} onClick={applyFilters}>
              Apply Filters
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setFrom("");
                setTo("");
                setReportType("ALL");
                // apply immediately
                setTimeout(() => {
                  applyFilters();
                }, 0);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
                <div className="h-4 w-28 animate-pulse rounded bg-slate-100 ring-1 ring-slate-200" />
                <div className="mt-3 h-9 w-20 animate-pulse rounded bg-slate-100 ring-1 ring-slate-200" />
                <div className="mt-3 h-3 w-44 animate-pulse rounded bg-slate-100 ring-1 ring-slate-200" />
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartSkeletonBlock />
            <ChartSkeletonBlock />
          </div>
          <TableSkeleton />
          <TableSkeleton />
        </div>
      ) : visible ? (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard
              label="SMS Sent"
              value={data?.sms?.total ?? 0}
              sub={kpis ? deltaText(kpis.smsSent) : "vs previous: —"}
              color="blue"
              icon={<SmsIcon />}
            />
            <StatCard
              label="Delivered"
              value={data?.sms?.sent ?? 0}
              sub={kpis ? deltaText(kpis.delivered) : "vs previous: —"}
              color="emerald"
              icon={<DeliveryIcon />}
            />
            <StatCard
              label="Pending"
              value={Math.max(0, (data?.sms?.total ?? 0) - (data?.sms?.sent ?? 0))}
              sub={kpis ? deltaText(kpis.pending) : "vs previous: —"}
              color="amber"
              icon={<ClockIcon />}
            />
            <StatCard
              label="Failed"
              value={data?.sms?.failed ?? 0}
              sub={kpis ? deltaText(kpis.failed) : "vs previous: —"}
              color="rose"
              icon={<ErrorIcon />}
            />
            <StatCard
              label="Unique Patients"
              value={data?.patients?.total ?? 0}
              sub={
                data?.patients?.thisMonth
                ? `+${data.patients.thisMonth} this month`
                : "vs previous: —"
              }
              color="violet"
              icon={<UserIcon />}
            />
          </div>

          {/* Analytics */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-0">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">SMS Performance</h3>
                    <p className="mt-1 text-sm text-slate-500">Sent, delivered and failed over time</p>
                  </div>
                  <Badge variant="outline">Last months</Badge>
                </div>
                <div className="mt-5">
                  {smsSeries && smsSeries.labels.length ? (
                    <LineChart labels={smsSeries.labels} series={smsSeries.series.map((s) => ({ ...s, values: s.values }))} />
                  ) : (
                    <EmptyState title="No chart data" description="Adjust the date range to load SMS performance." />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="p-0">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">SMS by Type</h3>
                    <p className="mt-1 text-sm text-slate-500">Appointment, medication, vaccination & more</p>
                  </div>
                  <Badge variant="outline">Donut</Badge>
                </div>
                <div className="mt-5">
                  {/* API currently doesn’t provide SMS type breakdown; keep UI skeleton/empty state */}
                  <DonutChartSkeleton />
                  <div className="-mt-6 mb-2 text-center text-xs text-slate-500">
                    Type breakdown requires additional data (UI placeholder).
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Table */}
          <Card className="p-0">
            <CardContent className="p-0">
              <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Recent SMS Activity</h3>
                  <p className="mt-1 text-sm text-slate-500">Search, filter by status, and review delivery results</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input placeholder="Search by patient or reminder type" className="h-10 w-full sm:w-72" />
                  <div className="flex items-center gap-2">
                    <StatusPill label="Delivered" tone="green" />
                    <StatusPill label="Pending" tone="orange" />
                    <StatusPill label="Failed" tone="red" />
                  </div>
                </div>
              </div>

              {/* Empty/placeholder table since /api/reports doesn’t provide per-message rows */}
              <div className="p-6">
                <EmptyState
                  title="No activity data available"
                  description="This dashboard UI is ready. Recent SMS log rows require an API endpoint that returns individual SMSLog records."
                />
              </div>
            </CardContent>
          </Card>

          {/* Optional Extra Section */}
          <Card className="p-0">
            <CardContent className="p-0">
              <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Patient Engagement</h3>
                  <p className="mt-1 text-sm text-slate-500">Top patients with most reminders and delivery rate</p>
                </div>
                <Badge variant="outline">Optional</Badge>
              </div>

              <div className="p-6">
                <EmptyState
                  title="Engagement metrics are not available"
                  description="UI placeholder (API currently returns only aggregated counts)."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState title="No data for selected range" description="Try a different date range or clear filters." />
      )}
    </div>
  );
}

function SmsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9-3-18-3 9H2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6" />
      <path d="M9 9l6 6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

