"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, StatCard } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { formatDateTime } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type SMSLog = {
  id: number;
  patientName?: string;
  phoneNumber: string;
  message: string;
  reminderType: string;
  status: string;
  sentAt: string;
  patient?: { id: number; fullName: string };
};

type ChartData = {
  name: string;
  value: number;
  percentage: number;
};

export default function ReportsPage() {
  // Summary stats
  const [stats, setStats] = useState({
    totalAll: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalPending: 0,
    totalFailed: 0,
    deliveryRate: 0,
  });

  // Chart data
  const [smsPerformance, setSmsPerformance] = useState<ChartData[]>([]);
  const [deliveryStatus, setDeliveryStatus] = useState<ChartData[]>([]);
  const [reminderTypes, setReminderTypes] = useState<ChartData[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);


  // SMS Reports table
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchLogs, setSearchLogs] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Filters
  const [dateRange, setDateRange] = useState<"7days" | "30days" | "90days" | "all">("30days");
  const [loading, setLoading] = useState(true);

  // Fetch summary stats
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/sms/stats`);
        const data = await res.json();

        const totalSms = data.total || 0;
        const sent = data.sent || 0;
        const delivered = data.delivered || 0;
        const failed = data.failed || 0;
        const pendingMessages = data.pendingMessages ?? data.pending ?? 0;

        const rate = totalSms > 0 ? Math.round((delivered / totalSms) * 100) : 0;

        setStats({
          totalAll: totalSms,
          totalSent: sent,
          totalDelivered: delivered,
          totalPending: pendingMessages,
          totalFailed: failed,
          deliveryRate: rate,
        });

        setSmsPerformance([
          { name: "Sent", value: sent, percentage: 0 },
          { name: "Pending", value: pendingMessages, percentage: 0 },
          { name: "Failed", value: failed, percentage: 0 },
        ]);

        setDeliveryStatus([
          { name: "Sent", value: sent, percentage: rate },
          { name: "Pending", value: pendingMessages, percentage: 0 },
          { name: "Failed", value: failed, percentage: 0 },
        ]);


        const reminderTypeTotal = (data.reminderTypes ?? []).reduce(
          (sum: number, rt: any) => sum + (rt.value || 0),
          0
        );
        setReminderTypes(
          (data.reminderTypes ?? []).map((rt: any) => ({
            name: rt.name,
            value: rt.value,
            percentage: reminderTypeTotal > 0 ? Math.round((rt.value / reminderTypeTotal) * 100) : 0,
          }))
        );

        setMonthlyTrends(data.monthlyTrends ?? []);

        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    })();
  }, []);

  // Fetch SMS logs
  useEffect(() => {
    const run = async () => {
      setLoadingLogs(true);
      try {
        const params = new URLSearchParams({
          search: searchLogs,
          status: statusFilter,
          page: String(page),
          limit: String(limit),
        });
        const res = await fetch(`/api/sms/logs?${params}`);
        const data = await res.json();
        setLogs(data.logs ?? []);
        setTotal(data.total ?? 0);
      } finally {
        setLoadingLogs(false);
      }
    };
    run();
  }, [searchLogs, statusFilter, page]);

  const totalPages = Math.ceil(total / limit);

 const fetchAllLogsForExport = async () => {
    const params = new URLSearchParams({
      search: searchLogs,
      status: statusFilter,
      page: "1",
      limit: "5000",
    });
    const res = await fetch(`/api/sms/logs?${params}`);
    const data = await res.json();
    return (data.logs ?? []) as SMSLog[];
  };

  const handleExportPDF = async () => {
    const allLogs = await fetchAllLogsForExport();
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("SMS Reports & Analytics", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated ${new Date().toLocaleString()}`, 14, 25);

    doc.setFontSize(11);
    doc.setTextColor(0);
    const summaryY = 34;
    doc.text(`Total SMS: ${stats.totalAll}`, 14, summaryY);
    doc.text(`Sent: ${stats.totalSent}`, 60, summaryY);
    doc.text(`Pending: ${stats.totalPending}`, 100, summaryY);
    doc.text(`Failed: ${stats.totalFailed}`, 145, summaryY);
    doc.text(`Acceptance Rate: ${stats.deliveryRate}%`, 14, summaryY + 7);

    autoTable(doc, {
      startY: summaryY + 15,
      head: [["Patient", "Phone", "Type", "Status", "Date Sent"]],
      body: allLogs.map((log) => [
        log.patient?.fullName ?? log.patientName ?? "-",
        log.phoneNumber,
        log.reminderType,
        log.status,
        formatDateTime(log.sentAt),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`sms-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportExcel = async () => {
    const allLogs = await fetchAllLogsForExport();

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ["SMS Reports & Analytics"],
      [`Generated ${new Date().toLocaleString()}`],
      [],
      ["Total SMS", stats.totalAll],
      ["Sent", stats.totalSent],
      ["Pending", stats.totalPending],
      ["Failed", stats.totalFailed],
      ["Acceptance Rate", `${stats.deliveryRate}%`],
    ]);

    const logsSheet = XLSX.utils.json_to_sheet(
      allLogs.map((log) => ({
        Patient: log.patient?.fullName ?? log.patientName ?? "-",
        Phone: log.phoneNumber,
        Type: log.reminderType,
        Status: log.status,
        "Date Sent": formatDateTime(log.sentAt),
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(wb, logsSheet, "SMS Log");

    XLSX.writeFile(wb, `sms-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <p className="text-slate-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Reports & Analytics"
          description="Monitor SMS performance, delivery rates, and trends"
        />
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportPDF}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-6-4m6 4l6-4" />
            </svg>
            Export PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportExcel}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-6-4m6 4l6-4" />
            </svg>
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 gap-4">
        <StatCard
          label="Total SMS"
          value={stats.totalAll}
          color="blue"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-6-4m6 4l6-4" />
            </svg>
          }
        />
        <StatCard
          label="Sent"
          value={stats.totalSent}
          color="emerald"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          label="Pending"
          value={stats.totalPending}
          color="amber"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Failed"
          value={stats.totalFailed}
          color="rose"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Acceptance Rate"
          value={`${stats.deliveryRate}%`}
          color="violet"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Date Range
              </label>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                options={[
                  { value: "7days", label: "Last 7 Days" },
                  { value: "30days", label: "Last 30 Days" },
                  { value: "90days", label: "Last 90 Days" },
                  { value: "all", label: "All Time" },
                ]}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Search Reports"
                placeholder="Patient name or phone..."
                value={searchLogs}
                onChange={(e) => {
                  setSearchLogs(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* SMS Performance */}
        <Card>
          <CardHeader title="SMS Performance" description="Message status breakdown" />
          <CardContent>
            <div className="space-y-4">
              {smsPerformance.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                     className={`h-full ${
                        item.name === "Sent"
                          ? "bg-blue-500"
                          : item.name === "Pending"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      style={{
                        width: `${
                          item.value > 0
                            ? (item.value /
                                (smsPerformance.reduce((sum, i) => sum + i.value, 0) || 1)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-3">
                {smsPerformance.map((item) => (
                  <div key={item.name} className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                    <p className="text-xs text-slate-500">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Status Pie */}
        <Card>
          <CardHeader title="Message Status" description="Current message statuses" />
          <CardContent>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={`${Math.PI * 100 * (stats.totalDelivered / (stats.totalSent || 1))} ${Math.PI * 100}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{stats.deliveryRate}%</p>
                    <p className="text-xs text-slate-500">Accepted</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {deliveryStatus.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.name === "Sent"
                          ? "bg-blue-500"
                          : item.name === "Pending"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                      
                    />
                    <span className="text-sm text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reminder Types */}
      <Card>
        <CardHeader title="Reminder Types Distribution" description="Messages by reminder category" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {reminderTypes.map((item) => (
              <div
                key={item.name}
                className="rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-center"
              >
                <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                <p className="text-xs text-slate-600 mt-1">{item.name}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader title="Monthly Trends" description="Sent vs. failed messages over time" />
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4" style={{ minWidth: "100%" }}>
              {monthlyTrends.map((trend, idx) => {
                const maxValue = Math.max(
                  ...monthlyTrends.map((t) => Math.max(t.sent, t.failed)),
                  1
                );
                return (
                  <div key={idx} className="flex-1 min-w-[80px]">
                    <div className="flex gap-1 items-end justify-center h-40 mb-2">
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-[10px] font-semibold text-slate-600">{trend.sent}</span>
                        <div
                          className="w-full bg-blue-400 rounded-t-sm transition-all"
                          style={{
                            height: `${(trend.sent / maxValue) * 120}px`,
                          }}
                          title={`Sent: ${trend.sent}`}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-[10px] font-semibold text-slate-600">{trend.failed}</span>
                        <div
                          className="w-full bg-rose-400 rounded-t-sm transition-all"
                          style={{
                            height: `${(trend.failed / maxValue) * 120}px`,
                          }}
                          title={`Failed: ${trend.failed}`}
                        />
                      </div>
                    </div>
                    <p className="text-xs font-medium text-slate-700 text-center">
                      {trend.month}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex gap-6 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-400" />
                <span className="text-sm text-slate-600">Sent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-rose-400" />
                <span className="text-sm text-slate-600">Failed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Reports Table */}
      <Card>
        <CardHeader title="Recent SMS Reports" description="Detailed SMS activity log" />
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Search"
                placeholder="Patient or phone..."
                value={searchLogs}
                onChange={(e) => {
                  setSearchLogs(e.target.value);
                  setPage(1);
                }}
              />
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "", label: "All Statuses" },
                  { value: "SENT", label: "Sent" },
                  { value: "DELIVERED", label: "Delivered" },
                  { value: "PENDING", label: "Pending" },
                  { value: "FAILED", label: "Failed" },
                ]}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date Sent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingLogs ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No SMS reports found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {log.patient?.fullName ?? log.patientName ?? "-"}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 text-xs">
                        {log.phoneNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {log.reminderType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={log.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDateTime(log.sentAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of{" "}
                {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
