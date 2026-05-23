import { monthlyNoShowData, appointments, patients, smsTemplates } from "@/lib/data";

const providerData = [
  { provider: "Dr. Martinez", noShows: 3, total: 95, avgConfirmRate: 81 },
  { provider: "Dr. Patel", noShows: 4, total: 88, avgConfirmRate: 74 },
  { provider: "Dr. Williams", noShows: 5, total: 82, avgConfirmRate: 69 },
];

const deliveryFunnel = [
  { stage: "Sent", value: 2890, icon: "📤" },
  { stage: "Delivered", value: 2836, icon: "📬" },
  { stage: "Read", value: 2190, icon: "👁" },
  { stage: "Replied", value: 1560, icon: "💬" },
  { stage: "Confirmed", value: 1320, icon: "✅" },
];

export default function AnalyticsPage() {
  const maxNoShow = Math.max(...monthlyNoShowData.map((d) => d.noShow));
  const maxRate = Math.max(...monthlyNoShowData.map((d) => Math.round((d.noShow / d.total) * 100)));
  const totalReminders = smsTemplates.reduce((s, t) => s + t.sentCount, 0);
  const confirmedAppts = appointments.filter((a) => a.status === "confirmed").length;
  const noShowAppts = appointments.filter((a) => a.status === "no-show").length;
  const noShowRate = Math.round((noShowAppts / appointments.length) * 100);
  const maxProvider = Math.max(...providerData.map((p) => p.total));

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">Performance overview — May 2026</p>
        </div>
        <button className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <KPICard label="Total Reminders Sent" value={totalReminders.toLocaleString()} sub="All time" trend="+23% vs prior period" up={true} />
        <KPICard label="SMS Delivery Rate" value="98.1%" sub="Industry avg: 92%" trend="+6.1% above avg" up={true} />
        <KPICard label="Confirmation Rate" value="76%" sub="This month" trend="+4 pts vs last month" up={true} />
        <KPICard label="No-Show Rate" value={`${noShowRate}%`} sub="This month" trend="-18% improvement" up={true} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Monthly no-show trend — rate % */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-semibold text-slate-900">No-Show Rate Trend</h2>
              <p className="text-sm text-slate-500">% of appointments that resulted in no-shows</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600">↓67%</p>
              <p className="text-xs text-slate-400">12-month improvement</p>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-44 mb-2">
            {monthlyNoShowData.map((d) => {
              const rate = Math.round((d.noShow / d.total) * 100);
              const heightPct = Math.round((rate / maxRate) * 100);
              const isLatest = d.month === "May '26";
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {rate}% ({d.noShow}/{d.total})
                  </div>
                  <div
                    className={`w-full rounded-t-md transition-all ${isLatest ? "bg-emerald-500" : "bg-slate-200 group-hover:bg-teal-300"}`}
                    style={{ height: `${heightPct}%`, minHeight: 4 }}
                  />
                  <span className="text-[10px] text-slate-400">{rate}%</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto mt-1">
            {monthlyNoShowData.map((d) => (
              <div key={d.month} className="flex-1 text-center text-[9px] text-slate-400 whitespace-nowrap">
                {d.month.split(" ")[0]}
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Funnel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Reminder Delivery Funnel</h2>
          <p className="text-sm text-slate-500 mb-6">This month — 2,890 reminders sent</p>
          <div className="space-y-4">
            {deliveryFunnel.map((stage, i) => {
              const pct = Math.round((stage.value / deliveryFunnel[0].value) * 100);
              const colors = ["bg-slate-400", "bg-blue-400", "bg-teal-400", "bg-emerald-400", "bg-emerald-600"];
              return (
                <div key={stage.stage}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-700 font-medium flex items-center gap-1.5">
                      <span className="text-base">{stage.icon}</span>
                      {stage.stage}
                    </span>
                    <span className="text-slate-500">
                      {stage.value.toLocaleString()}{" "}
                      <span className="text-slate-400 text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[i]} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {i < deliveryFunnel.length - 1 && (
                    <div className="flex justify-end mt-0.5">
                      <span className="text-xs text-slate-400">
                        Drop: {deliveryFunnel[0].value - deliveryFunnel[i + 1].value > 0
                          ? `${(((deliveryFunnel[i].value - deliveryFunnel[i + 1].value) / deliveryFunnel[i].value) * 100).toFixed(1)}% lost`
                          : ""}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Provider breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Provider No-Show Breakdown</h2>
          <p className="text-sm text-slate-500 mb-6">No-show rate by provider — this month</p>
          <div className="space-y-5">
            {providerData.map((p) => {
              const rate = Math.round((p.noShows / p.total) * 100);
              const widthPct = Math.round((p.total / maxProvider) * 100);
              return (
                <div key={p.provider}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-slate-800">{p.provider}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500">{p.noShows} no-shows</span>
                      <span className={`font-semibold ${rate > 5 ? "text-red-600" : "text-emerald-600"}`}>{rate}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${rate > 5 ? "bg-red-400" : "bg-emerald-400"}`}
                      style={{ width: `${(p.noShows / p.total) * 100 * 5}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-slate-400">
                    <span>{p.total} total appointments</span>
                    <span>Confirm rate: {p.avgConfirmRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Template performance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Template Performance</h2>
          <p className="text-sm text-slate-500 mb-6">Usage counts by template</p>
          <div className="space-y-4">
            {smsTemplates
              .sort((a, b) => b.sentCount - a.sentCount)
              .map((t) => {
                const maxSent = Math.max(...smsTemplates.map((tt) => tt.sentCount));
                const pct = Math.round((t.sentCount / maxSent) * 100);
                return (
                  <div key={t.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-slate-800 truncate max-w-[60%]">{t.name}</span>
                      <div className="flex items-center gap-2">
                        {!t.active && (
                          <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">inactive</span>
                        )}
                        <span className="text-sm text-slate-500">{t.sentCount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Total SMS sent</p>
                <p className="font-semibold text-slate-900 mt-0.5">{totalReminders.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Active templates</p>
                <p className="font-semibold text-slate-900 mt-0.5">{smsTemplates.filter((t) => t.active).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function KPICard({
  label,
  value,
  sub,
  trend,
  up,
}: {
  label: string;
  value: string;
  sub: string;
  trend: string;
  up: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-sm text-slate-500 mb-2">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      <p className={`text-xs font-medium mt-2 ${up ? "text-emerald-600" : "text-red-600"}`}>
        {up ? "↑" : "↓"} {trend}
      </p>
    </div>
  );
}
