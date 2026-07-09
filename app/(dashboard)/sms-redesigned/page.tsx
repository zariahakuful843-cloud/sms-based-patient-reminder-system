"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, StatCard } from "@/components/ui/Card";
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

function safeFirstName(fullName: string | undefined) {
  return (fullName ?? "").split(" ")[0] || "";
}

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toTimeValue(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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
  const patientName = params.patientName;

  switch (params.reminderType) {
    case "APPOINTMENT_REMINDER": {
      const d = params.appointmentDate ?? new Date();
      const time = params.appointmentTime ? params.appointmentTime : formatTime(d);
      return `Dear ${patientName}, this is a reminder that you have an appointment on ${formatDate(d)} at ${time}. Please arrive 15 minutes early.`;
    }
    case "MEDICATION_REMINDER": {
      const med = params.medicationName?.trim() || "your medication";
      return `Dear ${patientName}, this is a reminder to take your medication: ${med}. Follow your prescribed dosage.`;
    }
    case "VACCINATION_REMINDER": {
      const d = params.vaccinationDate ?? new Date();
      return `Dear ${patientName}, your vaccination is scheduled for ${formatDate(d)}. Please visit the facility on time.`;
    }
    case "ANTENATAL_REMINDER": {
      const d = params.antenatalDate ?? new Date();
      return `Dear ${patientName}, this is a reminder for your antenatal visit on ${formatDate(d)}. We look forward to seeing you.`;
    }
    case "FOLLOW_UP_REMINDER": {
      const d = params.followUpDate ?? new Date();
      return `Dear ${patientName}, this is a reminder for your follow-up visit on ${formatDate(d)}. Please contact the facility if you need to reschedule.`;
    }
    case "LABORATORY_TEST_REMINDER": {
      const d = params.laboratoryTestDate ?? new Date();
      return `Dear ${patientName}, your laboratory test is scheduled for ${formatDate(d)}. Please arrive on time and follow any preparation instructions.`;
    }
    default:
      return `Dear ${patientName}, this is a reminder.`;
  }
}

export default function SMSPageRedesigned() {
  const [activeTab, setActiveTab] = useState<"send" | "scheduled" | "activity">("send");

  const [patients, setPatients] = useState<Patient[]>([]);

  // Summary stats
  const [stats, setStats] = useState({
    sent: 0,
    delivered: 0,
    pending: 0,
    failed: 0,
  });

  // SMS History
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchLogs, setSearchLogs] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Scheduled reminders
  const [scheduled, setScheduled] = useState<ScheduledReminder[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  // Form state
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const [singleForm, setSingleForm] = useState({
    patientId: "",
    patientName: "",
    phoneNumber: "",
    reminderType: "APPOINTMENT_REMINDER" as ReminderTypeKey,
    appointmentDate: toISODate(new Date()),
    appointmentTime: toTimeValue(new Date()),
    medicationName: "",
    vaccinationDate: toISODate(new Date()),
    antenatalDate: toISODate(new Date()),
    followUpDate: toISODate(new Date()),
    laboratoryTestDate: toISODate(new Date()),
    messagePreview: "",
  });

  const [scheduleForm, setScheduleForm] = useState({
    patientId: "",
    reminderType: "APPOINTMENT_REMINDER" as ReminderTypeKey,
    scheduledAt: new Date().toISOString().slice(0, 16),
    appointmentDate: toISODate(new Date()),
    appointmentTime: toTimeValue(new Date()),
    medicationName: "",
    vaccinationDate: toISODate(new Date()),
    antenatalDate: toISODate(new Date()),
    followUpDate: toISODate(new Date()),
    laboratoryTestDate: toISODate(new Date()),
  });

  // Fetch patients
  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/patients?limit=200`);
      const d = await r.json();
      setPatients(d.patients ?? []);
    })();
  }, []);

  // Fetch summary stats
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/sms/stats`);
        const data = await res.json();
        setStats(data ?? { sent: 0, delivered: 0, pending: 0, failed: 0 });
      } catch (e) {
        console.error(e);
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

  // Fetch scheduled reminders
  useEffect(() => {
    const run = async () => {
      setLoadingScheduled(true);
      try {
        const res = await fetch(`/api/sms/scheduled?limit=5`);
        const data = await res.json();
        setScheduled((data.items ?? []).slice(0, 5));
      } finally {
        setLoadingScheduled(false);
      }
    };
    run();
  }, []);

  const computedSinglePreview = useMemo(() => {
    const dt = new Date(`${singleForm.appointmentDate}T${singleForm.appointmentTime}`);
    return buildPreview({
      reminderType: singleForm.reminderType,
      patientName: singleForm.patientName,
      appointmentDate: dt,
      appointmentTime: singleForm.appointmentTime,
      medicationName: singleForm.medicationName,
      vaccinationDate: new Date(singleForm.vaccinationDate),
      antenatalDate: new Date(singleForm.antenatalDate),
      followUpDate: new Date(singleForm.followUpDate),
      laboratoryTestDate: new Date(singleForm.laboratoryTestDate),
    });
  }, [singleForm]);

  useEffect(() => {
    setSingleForm((f) => ({ ...f, messagePreview: computedSinglePreview }));
  }, [computedSinglePreview]);

  function schedulePreview(patientName: string) {
    const dt = new Date(`${scheduleForm.appointmentDate}T${scheduleForm.appointmentTime}`);
    return buildPreview({
      reminderType: scheduleForm.reminderType,
      patientName,
      appointmentDate: dt,
      appointmentTime: scheduleForm.appointmentTime,
      medicationName: scheduleForm.medicationName,
      vaccinationDate: new Date(scheduleForm.vaccinationDate),
      antenatalDate: new Date(scheduleForm.antenatalDate),
      followUpDate: new Date(scheduleForm.followUpDate),
      laboratoryTestDate: new Date(scheduleForm.laboratoryTestDate),
    });
  }

  function handleSinglePatientSelect(patientId: string) {
    const p = patients.find((pt) => String(pt.id) === patientId);
    setSingleForm((f) => ({
      ...f,
      patientId,
      patientName: p ? safeFirstName(p.fullName) : "",
      phoneNumber: p?.phoneNumber ?? "",
    }));
  }

  async function onSendSingle() {
    if (!singleForm.patientName.trim() || !singleForm.phoneNumber.trim()) {
      setError("Patient Name and Phone Number are required.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const appointmentDateIso =
        singleForm.reminderType === "APPOINTMENT_REMINDER"
          ? new Date(`${singleForm.appointmentDate}T${singleForm.appointmentTime}`).toISOString()
          : undefined;

      const res = await fetch(`/api/sms/send-single`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: singleForm.patientId ? parseInt(singleForm.patientId) : undefined,
          phoneNumber: singleForm.phoneNumber,
          patientName: singleForm.patientName,
          reminderType: singleForm.reminderType,
          appointmentDate: appointmentDateIso,
          vaccinationDate:
            singleForm.reminderType === "VACCINATION_REMINDER"
              ? new Date(singleForm.vaccinationDate).toISOString()
              : undefined,
          antenatalDate:
            singleForm.reminderType === "ANTENATAL_REMINDER"
              ? new Date(singleForm.antenatalDate).toISOString()
              : undefined,
          followUpDate:
            singleForm.reminderType === "FOLLOW_UP_REMINDER"
              ? new Date(singleForm.followUpDate).toISOString()
              : undefined,
          laboratoryTestDate:
            singleForm.reminderType === "LABORATORY_TEST_REMINDER"
              ? new Date(singleForm.laboratoryTestDate).toISOString()
              : undefined,
          medicationName:
            singleForm.reminderType === "MEDICATION_REMINDER"
              ? singleForm.medicationName
              : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send SMS.");

      setSuccess("SMS sent successfully!");
      setPage(1);
      setSearchLogs("");
      setStatusFilter("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send SMS.");
    } finally {
      setBusy(false);
    }
  }

  async function onCreateScheduled() {
    if (!scheduleForm.patientId) {
      setError("Patient is required.");
      return;
    }

    const patient = patients.find((p) => String(p.id) === scheduleForm.patientId);
    if (!patient) {
      setError("Patient not found.");
      return;
    }

    const scheduledAt = new Date(scheduleForm.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      setError("Invalid scheduled date.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const message = schedulePreview(safeFirstName(patient.fullName));

      const res = await fetch(`/api/sms/scheduled`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          phoneNumber: patient.phoneNumber,
          patientName: safeFirstName(patient.fullName),
          reminderType: scheduleForm.reminderType,
          message,
          scheduledAt: scheduledAt.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule reminder.");

      setSuccess("Scheduled reminder created successfully!");
      setActiveTab("scheduled");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to schedule reminder.");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteScheduled(id: number) {
    if (!confirm("Delete this scheduled reminder?")) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/sms/scheduled/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete.");
      setSuccess("Scheduled reminder deleted.");
      const refreshRes = await fetch(`/api/sms/scheduled?limit=5`);
      const refreshData = await refreshRes.json();
      setScheduled((refreshData.items ?? []).slice(0, 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      setBusy(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="SMS & Reminders"
        description="Send, schedule, and track SMS reminders for patients"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 gap-4">
        <StatCard
          label="SMS Sent"
          value={stats.sent}
          color="blue"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-6-4m6 4l6-4" />
            </svg>
          }
        />
        <StatCard
          label="Delivered"
          value={stats.delivered}
          color="emerald"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          color="amber"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Failed"
          value={stats.failed}
          color="rose"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { value: "send", label: "Send Reminder" },
          { value: "scheduled", label: "Scheduled" },
          { value: "activity", label: "Recent Activity" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value as any)}
            className={`px-4 py-3 font-medium text-sm transition-all border-b-2 ${
              activeTab === tab.value
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications */}
      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm flex gap-3">
          <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm flex gap-3">
          <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Send Reminder Tab */}
      {activeTab === "send" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <Card>
            <CardHeader title="Send Reminder" description="Create and send SMS reminder to patient" />
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  onSendSingle();
                }}
              >
                <Select
                  label="Select Patient"
                  required
                  value={singleForm.patientId}
                  onChange={(e) => {
                    const id = e.target.value;
                    handleSinglePatientSelect(id);
                    setSingleForm((f) => ({ ...f, patientId: id }));
                  }}
                  options={[
                    { value: "", label: "Choose patient..." },
                    ...patients.map((p) => ({
                      value: String(p.id),
                      label: `${p.fullName} • ${p.phoneNumber}`,
                    })),
                  ]}
                />

                <Input
                  label="Phone Number"
                  required
                  value={singleForm.phoneNumber}
                  onChange={(e) => setSingleForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  placeholder="+233XXXXXXXXX"
                />

                <Select
                  label="Reminder Type"
                  required
                  value={singleForm.reminderType}
                  onChange={(e) => setSingleForm((f) => ({ ...f, reminderType: e.target.value as ReminderTypeKey }))}
                  options={REMINDER_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />

                {singleForm.reminderType === "APPOINTMENT_REMINDER" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Date"
                      required
                      type="date"
                      value={singleForm.appointmentDate}
                      onChange={(e) => setSingleForm((f) => ({ ...f, appointmentDate: e.target.value }))}
                    />
                    <Input
                      label="Time"
                      required
                      type="time"
                      value={singleForm.appointmentTime}
                      onChange={(e) => setSingleForm((f) => ({ ...f, appointmentTime: e.target.value }))}
                    />
                  </div>
                )}

                {singleForm.reminderType === "MEDICATION_REMINDER" && (
                  <Input
                    label="Medication Name"
                    required
                    value={singleForm.medicationName}
                    onChange={(e) => setSingleForm((f) => ({ ...f, medicationName: e.target.value }))}
                    placeholder="e.g. Amoxicillin 500mg"
                  />
                )}

                {singleForm.reminderType === "VACCINATION_REMINDER" && (
                  <Input
                    label="Date"
                    required
                    type="date"
                    value={singleForm.vaccinationDate}
                    onChange={(e) => setSingleForm((f) => ({ ...f, vaccinationDate: e.target.value }))}
                  />
                )}

                {singleForm.reminderType === "ANTENATAL_REMINDER" && (
                  <Input
                    label="Date"
                    required
                    type="date"
                    value={singleForm.antenatalDate}
                    onChange={(e) => setSingleForm((f) => ({ ...f, antenatalDate: e.target.value }))}
                  />
                )}

                {singleForm.reminderType === "FOLLOW_UP_REMINDER" && (
                  <Input
                    label="Date"
                    required
                    type="date"
                    value={singleForm.followUpDate}
                    onChange={(e) => setSingleForm((f) => ({ ...f, followUpDate: e.target.value }))}
                  />
                )}

                {singleForm.reminderType === "LABORATORY_TEST_REMINDER" && (
                  <Input
                    label="Date"
                    required
                    type="date"
                    value={singleForm.laboratoryTestDate}
                    onChange={(e) => setSingleForm((f) => ({ ...f, laboratoryTestDate: e.target.value }))}
                  />
                )}

                <Button type="submit" loading={busy} className="w-full">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-6-4m6 4l6-4" />
                  </svg>
                  Send SMS
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Message Preview */}
          <Card>
            <CardHeader title="Message Preview" description="This is the message patients will receive" />
            <CardContent>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Message Preview</p>
                    <p className="text-xs text-slate-500 mt-0.5">Customized per patient</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-6-4m6 4l6-4" />
                    </svg>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 border border-blue-100">
                  <p className="text-sm text-slate-700 leading-relaxed">{singleForm.messagePreview}</p>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Length:</span> {singleForm.messagePreview.length} characters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scheduled Reminders Tab */}
      {activeTab === "scheduled" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create Form */}
          <Card>
            <CardHeader title="Create Scheduled Reminder" description="Set reminder to send at specific time" />
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  onCreateScheduled();
                }}
              >
                <Select
                  label="Patient"
                  required
                  value={scheduleForm.patientId}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, patientId: e.target.value }))}
                  options={[
                    { value: "", label: "Select patient..." },
                    ...patients.map((p) => ({
                      value: String(p.id),
                      label: `${p.fullName} (${p.phoneNumber})`,
                    })),
                  ]}
                />

                <Select
                  label="Reminder Type"
                  required
                  value={scheduleForm.reminderType}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, reminderType: e.target.value as ReminderTypeKey }))}
                  options={REMINDER_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />

                {scheduleForm.reminderType === "APPOINTMENT_REMINDER" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Appointment Date"
                      required
                      type="date"
                      value={scheduleForm.appointmentDate}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, appointmentDate: e.target.value }))}
                    />
                    <Input
                      label="Time"
                      required
                      type="time"
                      value={scheduleForm.appointmentTime}
                      onChange={(e) => setScheduleForm((f) => ({ ...f, appointmentTime: e.target.value }))}
                    />
                  </div>
                )}

                {scheduleForm.reminderType === "MEDICATION_REMINDER" && (
                  <Input
                    label="Medication Name"
                    required
                    value={scheduleForm.medicationName}
                    onChange={(e) => setScheduleForm((f) => ({ ...f, medicationName: e.target.value }))}
                  />
                )}

                <Input
                  label="Send At"
                  required
                  type="datetime-local"
                  value={scheduleForm.scheduledAt}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                />

                <Button type="submit" loading={busy} className="w-full">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Schedule Reminder
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Scheduled List */}
          <Card>
            <CardHeader title="Upcoming Reminders" description={`${scheduled.length} scheduled`} />
            <CardContent>
              {loadingScheduled ? (
                <div className="py-8 text-center text-slate-400">Loading...</div>
              ) : scheduled.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No scheduled reminders</div>
              ) : (
                <div className="space-y-3">
                  {scheduled.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900 text-sm">{item.patientName}</p>
                            <Badge status={item.status} />
                          </div>
                          <p className="text-xs text-slate-500 mb-2">{item.phoneNumber}</p>
                          <p className="text-xs text-slate-600 leading-relaxed truncate">
                            {item.message.substring(0, 80)}...
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteScheduled(item.id)}
                          disabled={busy}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Scheduled: {formatDateTime(item.scheduledAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <Card>
          <CardHeader title="Recent SMS Activity" description="All sent and pending SMS messages" />
          <CardContent>
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Search"
                  value={searchLogs}
                  onChange={(e) => {
                    setSearchLogs(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Patient name or phone..."
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
                      Sent
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
                        No SMS activity
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
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
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
      )}
    </div>
  );
}
