import { appointments, dashboardStats, monthlyNoShowData, patients } from "@/lib/data";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  scheduled: "bg-blue-100 text-blue-700",
  "no-show": "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
  completed: "bg-purple-100 text-purple-700",
};

export default function DashboardPage() {
  const upcomingAppointments = appointments
    .filter((a) => a.status === "scheduled" || a.status === "confirmed")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const chronicNoShows = patients.filter((p) => p.noShowCount >= 3);

  const maxNoShow = Math.max(...monthlyNoShowData.map((d) => d.noShow));

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Friday, May 23, 2026 — Good morning, Maria!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Reminders Sent Today"
          value={dashboardStats.remindersSentToday}
          unit=""
          trend="+12% vs yesterday"
          trendUp={true}
          color="teal"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          }
        />
        <StatCard
          label="Confirmation Rate"
          value={dashboardStats.confirmationRate}
          unit="%"
          trend="+4% this week"
          trendUp={true}
          color="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Pending Confirmations"
          value={dashboardStats.pendingConfirmations}
          unit=""
          trend="Due today"
          trendUp={null}
          color="amber"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="No-Shows This Month"
          value={dashboardStats.noShowsThisMonth}
          unit=""
          trend="-18% vs last month"
          trendUp={true}
          color="red"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* No-Show Trend Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-slate-900">No-Show Trend</h2>
              <p className="text-sm text-slate-500">Monthly no-shows over last 12 months</p>
            </div>
            <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
              ↓ 67% improvement
            </span>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-2 h-40">
            {monthlyNoShowData.map((d) => {
              const heightPct = Math.round((d.noShow / maxNoShow) * 100);
              const rate = Math.round((d.noShow / d.total) * 100);
              const isLatest = d.month === "May '26";
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {d.noShow} no-shows ({rate}%)
                  </div>
                  <div
                    className={`w-full rounded-t-sm transition-all ${isLatest ? "bg-teal-500" : "bg-slate-200 group-hover:bg-teal-300"}`}
                    style={{ height: `${heightPct}%`, minHeight: 4 }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-2 overflow-x-auto">
            {monthlyNoShowData.map((d) => (
              <div key={d.month} className="flex-1 text-center text-[10px] text-slate-400 whitespace-nowrap">
                {d.month.split(" ")[0]}
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Metrics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Delivery Metrics</h2>
          <p className="text-sm text-slate-500 mb-6">This month's SMS funnel</p>
          <div className="space-y-5">
            <FunnelRow label="Sent" value={2890} total={2890} color="bg-slate-300" />
            <FunnelRow label="Delivered" value={2836} total={2890} color="bg-blue-400" />
            <FunnelRow label="Opened/Read" value={2190} total={2890} color="bg-teal-400" />
            <FunnelRow label="Replied" value={1560} total={2890} color="bg-emerald-500" />
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
            <span className="text-slate-500">Reply rate</span>
            <span className="font-semibold text-emerald-600">54%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Upcoming Appointments</h2>
            <a href="/appointments" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              View all →
            </a>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingAppointments.map((appt) => (
              <div key={appt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                  {appt.patientName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{appt.patientName}</p>
                  <p className="text-xs text-slate-500">{appt.provider} · {appt.type}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-slate-700">{appt.date}</p>
                  <p className="text-xs text-slate-500">{appt.time}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${statusColors[appt.status]}`}>
                  {appt.status}
                </span>
                <div className="text-xs text-slate-400 shrink-0">
                  {appt.remindersSent} sent
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Alerts</h2>
          </div>
          <div className="p-4 space-y-3">
            {/* Chronic no-show alert */}
            {chronicNoShows.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-800">Chronic No-Shows</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      {chronicNoShows.length} patient{chronicNoShows.length > 1 ? "s" : ""} flagged: {chronicNoShows.map(p => p.name.split(" ")[0]).join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Reminders Pending</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    2 appointments tomorrow have no reminders sent yet
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-teal-800">Delivery Rate Healthy</p>
                  <p className="text-xs text-teal-600 mt-0.5">
                    {dashboardStats.reminderDeliveryRate}% delivery rate — above 95% target
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-800">Avg. Response Time</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Patients reply within {dashboardStats.avgResponseTime} on average
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  unit,
  trend,
  trendUp,
  color,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  trend: string;
  trendUp: boolean | null;
  color: "teal" | "emerald" | "amber" | "red";
  icon: React.ReactNode;
}) {
  const colorMap = {
    teal: { bg: "bg-teal-50", icon: "bg-teal-100 text-teal-600", trend: "text-teal-600" },
    emerald: { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", trend: "text-emerald-600" },
    amber: { bg: "bg-amber-50", icon: "bg-amber-100 text-amber-600", trend: "text-amber-600" },
    red: { bg: "bg-red-50", icon: "bg-red-100 text-red-600", trend: "text-emerald-600" },
  };
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-lg ${c.icon} flex items-center justify-center`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-slate-900">
        {value}
        <span className="text-xl">{unit}</span>
      </p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      <p className={`text-xs font-medium mt-2 ${trendUp === null ? "text-slate-400" : c.trend}`}>
        {trendUp === true && "↑ "}
        {trendUp === false && "↓ "}
        {trend}
      </p>
    </div>
  );
}

function FunnelRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-500">{value.toLocaleString()} <span className="text-slate-400 text-xs">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
