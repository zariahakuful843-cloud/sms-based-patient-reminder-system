"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { formatDateTime } from "@/lib/utils";

type SMSLog = {
  id: number;
  patientId?: number;
  patientName?: string;
  phoneNumber: string;
  message: string;
  reminderType: string;
  status: string;
  sentAt: string;
  patient?: { id: number; fullName: string };
};

type Patient = { id: number; fullName: string; phoneNumber: string };

type ReminderTypeKey =
  | "APPOINTMENT_REMINDER"
  | "MEDICATION_REMINDER"
  | "VACCINATION_REMINDER"
  | "ANTENATAL_REMINDER"
  | "FOLLOW_UP_REMINDER"
  | "LABORATORY_TEST_REMINDER";

type ScheduledReminder = {
  id: number;
  patientId: number;
  patientName: string;
  phoneNumber: string;
  reminderType: ReminderTypeKey;
  message: string;
  status: string;
  scheduledAt: string;
};

const REMINDER_TYPES: { value: ReminderTypeKey; label: string }[] = [
  { value: "APPOINTMENT_REMINDER", label: "Appointment Reminder" },
  { value: "MEDICATION_REMINDER", label: "Medication Reminder" },
  { value: "VACCINATION_REMINDER", label: "Vaccination Reminder" },
  { value: "ANTENATAL_REMINDER", label: "Antenatal Reminder" },
  { value: "FOLLOW_UP_REMINDER", label: "Follow-Up Reminder" },
  { value: "LABORATORY_TEST_REMINDER", label: "Laboratory Test Reminder" },
];

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTimeValue(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function buildPreview(params: {
  reminderType: ReminderTypeKey;
  patientName: string;
  appointmentDate?: Date;
  appointmentTime?: string;
  vaccinationDate?: Date;
  antenatalDate?: Date;
  followUpDate?: Date;
  laboratoryTestDate?: Date;
  medicationName?: string;
}): string {
  const name = params.patientName || "[Patient Name]";
  switch (params.reminderType) {
    case "APPOINTMENT_REMINDER": {
      const d = params.appointmentDate ?? new Date();
      return `Dear ${name}, this is a reminder that you have an appointment on ${formatDate(d)} at ${params.appointmentTime || formatTime(d)}. Please arrive 15 minutes early.`;
    }
    case "MEDICATION_REMINDER":
      return `Dear ${name}, this is a reminder to take your medication: ${params.medicationName?.trim() || "your medication"}. Follow your prescribed dosage.`;
    case "VACCINATION_REMINDER":
      return `Dear ${name}, your vaccination is scheduled for ${formatDate(params.vaccinationDate ?? new Date())}. Please visit the facility on time.`;
    case "ANTENATAL_REMINDER":
      return `Dear ${name}, this is a reminder for your antenatal visit on ${formatDate(params.antenatalDate ?? new Date())}. We look forward to seeing you.`;
    case "FOLLOW_UP_REMINDER":
      return `Dear ${name}, this is a reminder for your follow-up visit on ${formatDate(params.followUpDate ?? new Date())}. Please contact the facility if you need to reschedule.`;
    case "LABORATORY_TEST_REMINDER":
      return `Dear ${name}, your laboratory test is scheduled for ${formatDate(params.laboratoryTestDate ?? new Date())}. Please arrive on time and follow preps.`;
    default:
      return `Dear ${name}, this is a system notification reminder.`;
  }
}

export default function SMSPage() {
  const [tab, setTab] = useState<"single" | "bulk" | "history" | "scheduled" | "failed">("single");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchLogs, setSearchLogs] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const [scheduled, setScheduled] = useState<ScheduledReminder[]>([]);
  const [scheduledTotal, setScheduledTotal] = useState(0);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [scheduledSearch, setScheduledSearch] = useState("");
  const [scheduledPage, setScheduledPage] = useState(1);
  const scheduledLimit = 10;

  const [stats, setStats] = useState({ sent: 0, failed: 0, scheduledCount: 0 });
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const [singleForm, setSingleForm] = useState({
    patientId: "", phoneNumber: "", reminderType: "APPOINTMENT_REMINDER" as ReminderTypeKey,
    appointmentDate: toISODate(new Date()), appointmentTime: toTimeValue(new Date()), medicationName: "",
    vaccinationDate: toISODate(new Date()), antenatalDate: toISODate(new Date()), followUpDate: toISODate(new Date()),
    laboratoryTestDate: toISODate(new Date()), isScheduled: false, scheduleDateTime: "",
  });

  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkReminderType, setBulkReminderType] = useState<ReminderTypeKey>("APPOINTMENT_REMINDER");
  const [bulkIsScheduled, setBulkIsScheduled] = useState(false);
  const [bulkScheduleDateTime, setBulkScheduleDateTime] = useState("");

  const fetchAnalyticsSummary = async () => {
    try {
      const res = await fetch("/api/sms/stats");
      if (res.ok) { const data = await res.json(); if (data) setStats(data); }
    } catch {
      setStats({ sent: logs.filter(l => l.status === "SENT").length, failed: logs.filter(l => l.status === "FAILED").length, scheduledCount: scheduled.length });
    }
  };

  const fetchLogDataHistory = async () => {
    setLoadingLogs(true);
    try {
      let url = `/api/sms/logs?page=${page}&limit=${limit}&search=${searchLogs}`;
      if (tab === "failed") url += "&status=FAILED";
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); } finally { setLoadingLogs(false); }
  };

  const fetchScheduledRemindersData = async () => {
    setLoadingScheduled(true);
    try {
      const res = await fetch(`/api/sms/scheduled?page=${scheduledPage}&limit=${scheduledLimit}&search=${scheduledSearch}`);
      const data = await res.json();
      setScheduled(data.scheduled || []);
      setScheduledTotal(data.total || 0);
    } catch (err) { console.error(err); } finally { setLoadingScheduled(false); }
  };

  useEffect(() => {
    async function initPageData() {
      try {
        const patientRes = await fetch("/api/patients");
        const patientData = await patientRes.json();
        if (Array.isArray(patientData)) setPatients(patientData);
        else if (patientData && Array.isArray(patientData.data)) setPatients(patientData.data);
        fetchAnalyticsSummary(); fetchLogDataHistory(); fetchScheduledRemindersData();
      } catch (err) { console.error("Initialization error:", err); }
    }
    initPageData();
  }, [tab, page, scheduledPage, searchLogs, scheduledSearch]);

  const handlePatientSelectChange = (id: string) => {
    const p = patients.find((pat) => String(pat.id) === id);
    setSingleForm((prev) => ({ ...prev, patientId: id, phoneNumber: p ? p.phoneNumber : "" }));
  };

    const activePatientName = patients.find((p) => String(p.id) === singleForm.patientId)?.fullName || "";
    const calculatedLiveMessageString = useMemo(() => {
       return buildPreview({
          reminderType: singleForm.reminderType, patientName: activePatientName,
          appointmentDate: singleForm.appointmentDate ? new Date(singleForm.appointmentDate) : undefined,
          appointmentTime: singleForm.appointmentTime,
          vaccinationDate: singleForm.vaccinationDate ? new Date(singleForm.vaccinationDate) : undefined,
          antenatalDate: singleForm.antenatalDate ? new Date(singleForm.antenatalDate) : undefined,
          followUpDate: singleForm.followUpDate ? new Date(singleForm.followUpDate) : undefined,
          laboratoryTestDate: singleForm.laboratoryTestDate ? new Date(singleForm.laboratoryTestDate) : undefined,
          medicationName: singleForm.medicationName,
      });
   }, [singleForm, activePatientName]);

  const handleSendSingleSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.patientId) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "single", patientId: Number(singleForm.patientId), message: calculatedLiveMessageString,
          reminderType: singleForm.reminderType, phoneNumber: singleForm.phoneNumber || undefined,
          scheduleTime: singleForm.isScheduled ? new Date(singleForm.scheduleDateTime).toISOString() : undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Execution failed.");
      setSuccess(singleForm.isScheduled ? "SMS scheduled successfully!" : "SMS sent successfully!");
      setSingleForm((prev) => ({ ...prev, patientId: "", phoneNumber: "", isScheduled: false, scheduleDateTime: "" }));
    } catch (err: any) { setError(err.message || "Failed to submit request."); } finally { setBusy(false); }
  };

  const handleSendBulkSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkMessage.trim()) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "bulk", message: bulkMessage, reminderType: bulkReminderType,
          scheduleTime: bulkIsScheduled ? new Date(bulkScheduleDateTime).toISOString() : undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Bulk process failed.");
      setSuccess(bulkIsScheduled ? "Bulk campaign scheduled!" : "Bulk messages dispatched successfully!");
      setBulkMessage(""); setBulkIsScheduled(false); setBulkScheduleDateTime("");
    } catch (err: any) { setError(err.message || "Failed to deploy broadcast."); } finally { setBusy(false); }
  };

    const handleDeleteScheduledReminder = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this scheduled reminder?")) return;
    try {
      const res = await fetch(`/api/sms/scheduled/${id}`, { method: "DELETE" });
      if (res.ok) { 
        setSuccess("Scheduled reminder cancelled cleanly."); 
        fetchScheduledRemindersData(); 
      }
    } catch { 
      setError("Failed to cancel scheduled task."); 
    }
  };


  return (
    <div className="space-y-6 p-4 sm:p-6 bg-slate-50/50 min-h-screen">
      <PageHeader title="SMS & Notifications Gateway" description="Manage templates, broadcasting lines, and background alerts." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border p-5 bg-white shadow-sm flex justify-between items-center">
          <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dispatched SMS</p><p className="text-2xl font-bold text-gray-800 mt-1">{stats.sent}</p></div>
          <div className="text-emerald-500 bg-emerald-50 p-2.5 rounded-lg text-lg">✓</div>
        </div>
        <div className="rounded-xl border p-5 bg-white shadow-sm flex justify-between items-center">
          <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Scheduled Tasks</p><p className="text-2xl font-bold text-gray-800 mt-1">{stats.scheduledCount}</p></div>
          <div className="text-blue-500 bg-blue-50 p-2.5 rounded-lg text-lg">⏰</div>
        </div>
        <div className="rounded-xl border p-5 bg-white shadow-sm flex justify-between items-center">
          <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivery Failures</p><p className="text-2xl font-bold text-gray-800 mt-1">{stats.failed}</p></div>
          <div className="text-red-500 bg-red-50 p-2.5 rounded-lg text-lg">⚠️</div>
        </div>
      </div>
      {success && <div className="p-4 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-100">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">{error}</div>}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {(["single", "bulk", "history", "scheduled", "failed"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-800"}`}>
            {t === "single" && "👤 Single SMS"}{t === "bulk" && "👥 Bulk Broadcast"}{t === "history" && "📋 Recent Activity"}{t === "scheduled" && "⏰ Future Scheduled"}{t === "failed" && "❌ Failures"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {tab === "single" && (
            <Card className="bg-white shadow-sm border border-gray-100 rounded-xl">
              <CardHeader className="p-5 font-bold text-gray-800 border-b border-gray-50">Configure Single Patient Reminder</CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSendSingleSMS} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Select Patient *</label>
                      <Select value={singleForm.patientId} onChange={(e) => handlePatientSelectChange(e.target.value)} required>
                        <option value="">-- Choose Patient Contact --</option>
                        {patients.map((p) => <option key={p.id} value={String(p.id)}>{p.fullName}</option>)}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Target Phone Connection</label>
                      <Input type="text" placeholder="Autofilled phone path..." value={singleForm.phoneNumber} onChange={(e) => setSingleForm(prev => ({ ...prev, phoneNumber: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Notification Category Template *</label>
                    <Select value={singleForm.reminderType} onChange={(e) => setSingleForm(prev => ({ ...prev, reminderType: e.target.value as ReminderTypeKey }))}>
                      {REMINDER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Select>
                  </div>
                  {singleForm.reminderType === "APPOINTMENT_REMINDER" && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div><label className="block text-[11px] text-gray-500 mb-1">Date</label><Input type="date" value={singleForm.appointmentDate} onChange={(e) => setSingleForm(prev => ({ ...prev, appointmentDate: e.target.value }))} /></div>
                      <div><label className="block text-[11px] text-gray-500 mb-1">Time Window</label><Input type="time" value={singleForm.appointmentTime} onChange={(e) => setSingleForm(prev => ({ ...prev, appointmentTime: e.target.value }))} /></div>
                    </div>
                  )}
                  {singleForm.reminderType === "MEDICATION_REMINDER" && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <label className="block text-[11px] text-gray-500 mb-1">Prescription Medication Details</label>
                      <Input type="text" placeholder="e.g., Amoxicillin 500mg" value={singleForm.medicationName} onChange={(e) => setSingleForm(prev => ({ ...prev, medicationName: e.target.value }))} />
                    </div>
                  )}
                  {singleForm.reminderType === "VACCINATION_REMINDER" && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <label className="block text-[11px] text-gray-500 mb-1">Target Immunization Release Date</label>
                      <Input type="date" value={singleForm.vaccinationDate} onChange={(e) => setSingleForm(prev => ({ ...prev, vaccinationDate: e.target.value }))} />
                    </div>
                  )}
                  <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 select-none">
                      <input type="checkbox" checked={singleForm.isScheduled} onChange={(e) => setSingleForm(prev => ({ ...prev, isScheduled: e.target.checked }))} className="rounded accent-blue-600 h-4 w-4" />
                      Decline instant dispatch, schedule for future delivery
                    </label>
                    {singleForm.isScheduled && (
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target Execution Release Time</label>
                        <Input type="datetime-local" value={singleForm.scheduleDateTime} onChange={(e) => setSingleForm(prev => ({ ...prev, scheduleDateTime: e.target.value }))} required={singleForm.isScheduled} />
                      </div>
                    )}
                  </div>
                  <Button type="submit" disabled={busy} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-xs tracking-wider uppercase">
                    {busy ? "Processing Request..." : singleForm.isScheduled ? "⏰ Schedule Reminder" : "📨 Send SMS Now"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          {tab === "bulk" && (
            <Card className="bg-white shadow-sm border border-gray-100 rounded-xl">
              <CardHeader className="p-5 font-bold text-gray-800 border-b border-gray-50">Broadcast Bulk Hospital SMS Alert Campaign</CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSendBulkSMS} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Target Notification Context Category</label>
                    <Select value={bulkReminderType} onChange={(e) => setBulkReminderType(e.target.value as ReminderTypeKey)}>
                      {REMINDER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Message Body Content *</label>
                    <Textarea value={bulkMessage} onChange={(e) => setBulkMessage(e.target.value)} placeholder="Type out custom transmission text strings..." className="h-32 resize-none" required />
                  </div>
                  <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 select-none">
                      <input type="checkbox" checked={bulkIsScheduled} onChange={(e) => setBulkIsScheduled(e.target.checked)} className="rounded accent-blue-600 h-4 w-4" />
                      Schedule bulk broadcast for future target window
                    </label>
                    {bulkIsScheduled && (
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target Release Delivery Execution Time</label>
                        <Input type="datetime-local" value={bulkScheduleDateTime} onChange={(e) => setBulkScheduleDateTime(e.target.value)} required={bulkIsScheduled} />
                      </div>
                    )}
                  </div>
                  <Button type="submit" disabled={busy} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-xs tracking-wider uppercase">
                    {busy ? "Processing Campaign Operations..." : bulkIsScheduled ? "⏰ Schedule Bulk Target Release" : "📢 Execute Immediate Global Broadcast"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          {(tab === "history" || tab === "failed") && (
            <Card className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
              <div className="p-4 bg-white border-b border-gray-50 flex items-center justify-between">
                <Input type="text" placeholder="Search logs by patient name..." value={searchLogs} onChange={(e) => { setSearchLogs(e.target.value); setPage(1); }} className="max-w-xs text-xs" />
                <span className="text-xs font-semibold text-gray-400">Total lines: {total}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="p-4">Patient Target</th><th className="p-4">Phone Connection</th><th className="p-4">Message Content Snippet</th><th className="p-4">Status</th><th className="p-4">Date Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                    {loadingLogs ? (<tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading system logs...</td></tr>) : logs.length === 0 ? (<tr><td colSpan={5} className="p-8 text-center text-gray-400">No matching history records mapped.</td></tr>) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-semibold text-gray-900">{log.patientName || "Global Broadcast"}</td>
                          <td className="p-4 text-gray-500">{log.phoneNumber}</td>
                          <td className="p-4 text-gray-500 max-w-xs truncate">{log.message}</td>
                          <td className="p-4"><Badge className={log.status === "SENT" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>{log.status}</Badge></td>
                          <td className="p-4 text-gray-400">{formatDateTime(log.sentAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
          {tab === "scheduled" && (
            <Card className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
              <div className="p-4 bg-white border-b border-gray-50 flex items-center justify-between">
                <Input type="text" placeholder="Search scheduled queues..." value={scheduledSearch} onChange={(e) => { setScheduledSearch(e.target.value); setScheduledPage(1); }} className="max-w-xs text-xs" />
                <span className="text-xs font-semibold text-gray-400">Total queued: {scheduledTotal}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="p-4">Patient Target</th><th className="p-4">Phone Path</th><th className="p-4">Content Context</th><th className="p-4">Scheduled Release Time</th><th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                    {loadingScheduled ? (<tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading scheduled records...</td></tr>) : scheduled.length === 0 ? (<tr><td colSpan={5} className="p-8 text-center text-gray-400">No upcoming tasks queued.</td></tr>) : (
                      scheduled.map((sch) => (
                        <tr key={sch.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-semibold text-gray-900">{sch.patientName}</td>
                          <td className="p-4 text-gray-500">{sch.phoneNumber}</td>
                          <td className="p-4 text-gray-500 max-w-xs truncate">{sch.message}</td>
                          <td className="p-4 text-blue-600 font-medium">{formatDateTime(sch.scheduledAt)}</td>
                          <td className="p-4 text-right"><button type="button" onClick={() => handleDeleteScheduledReminder(sch.id)} className="text-red-500 font-bold hover:text-red-700 text-xs px-2 py-1 rounded border border-red-100 hover:bg-red-50">Cancel</button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card className="bg-white border border-gray-100 shadow-sm rounded-xl sticky top-6">
            <CardHeader className="p-5 font-bold text-gray-800 border-b border-gray-50">Live Output Tracker</CardHeader>
            <CardContent className="p-6">
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-gray-700 min-h-[140px] flex flex-col justify-between">
                <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">{tab === "single" ? calculatedLiveMessageString : bulkMessage || "Type into campaign fields to visualize..."}</p>
                <div className="text-[10px] text-gray-400 border-t border-blue-100 pt-2.5 mt-4 flex justify-between font-bold uppercase">
                  <span>Count: {tab === "single" ? calculatedLiveMessageString.length : bulkMessage.length} Chars</span>
                  <span>Units: {Math.ceil((tab === "single" ? calculatedLiveMessageString.length : bulkMessage.length) / 160) || 0} SMS</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
