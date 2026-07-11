"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { formatDateTime } from "@/lib/utils";
import { useCanSendReminder } from "@/lib/session-context";

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

// Summary Card Component
function SummaryCard({
  icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: string;
  color: "blue" | "green" | "amber" | "red";
}) {
  const colorMap = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    green: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    red: "bg-red-50 border-red-100 text-red-700",
  };

  const iconColorMap = {
    blue: "text-blue-600",
    green: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
  };

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium opacity-80">{label}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold">{value}</p>
          {trend && <p className="mt-1 text-xs opacity-70">{trend}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconColorMap[color]} opacity-70`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Tabs Component
function Tabs({
  value,
  onChange,
}: {
  value: "single" | "bulk" | "history" | "scheduled" | "failed";
  onChange: (v: "single" | "bulk" | "history" | "scheduled" | "failed") => void;
}) {
  const items = [
    { value: "single", label: "Send Single SMS" },
    { value: "bulk", label: "Send Bulk SMS" },
    { value: "history", label: "SMS History" },
    { value: "scheduled", label: "Scheduled Reminders" },
    { value: "failed", label: "Failed Messages" },
  ] as const;

  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
            value === it.value
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export default function SMSPage() {
  const [tab, setTab] = useState<"single" | "bulk" | "history" | "scheduled" | "failed">("single");

  const [patients, setPatients] = useState<Patient[]>([]);

  // SMS History / Failed messages
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchLogs, setSearchLogs] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Scheduled reminders
  const [scheduled, setScheduled] = useState<ScheduledReminder[]>([]);
  const [scheduledTotal, setScheduledTotal] = useState(0);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [scheduledSearch, setScheduledSearch] = useState("");
  const [scheduledStatus, setScheduledStatus] = useState("");
  const [scheduledPage, setScheduledPage] = useState(1);
  const scheduledLimit = 10;

  // Summary stats
  const [stats, setStats] = useState({ sent: 0, delivered: 0, pending: 0, failed: 0 });

  // Feedback + busy
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Test SMS
  const [testPhone, setTestPhone] = useState("");

  // Send Single SMS form (required fields)
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

  // Send Bulk SMS form
  const [bulk, setBulk] = useState({
    reminderType: "APPOINTMENT_REMINDER" as ReminderTypeKey,
    recipientsText: "John Doe,+233XXXXXXXXX\nJane Doe,+233YYYYYYYY\n",
    appointmentDate: toISODate(new Date()),
    appointmentTime: toTimeValue(new Date()),
    medicationName: "",
    vaccinationDate: toISODate(new Date()),
    antenatalDate: toISODate(new Date()),
    followUpDate: toISODate(new Date()),
    laboratoryTestDate: toISODate(new Date()),
  });

  // Scheduled create form
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

  // Reminder types are filtered to what the current role is allowed to send.
  const canSend = useCanSendReminder();
  const allowedReminderTypes = useMemo(
    () => REMINDER_TYPES.filter((t) => canSend(t.value)),
    [canSend]
  );

  useEffect(() => {
    if (allowedReminderTypes.length === 0) return;
    const allowed = allowedReminderTypes.map((t) => t.value);
    const first = allowedReminderTypes[0].value;
    setSingleForm((f) => (allowed.includes(f.reminderType) ? f : { ...f, reminderType: first }));
    setBulk((b) => (allowed.includes(b.reminderType) ? b : { ...b, reminderType: first }));
    setScheduleForm((s) => (allowed.includes(s.reminderType) ? s : { ...s, reminderType: first }));
  }, [allowedReminderTypes]);

  useEffect(() => {
    setSuccess("");
    setError("");
  }, [tab]);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/patients?limit=200`);
      const d = await r.json();
      setPatients(d.patients ?? []);
    })();
  }, []);

  // Fetch stats
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/sms/logs?limit=1`);
        const d = await r.json();
        const allLogs = d.logs ?? [];
        const sent = allLogs.filter((l: SMSLog) => l.status === "SENT").length;
        const failed = allLogs.filter((l: SMSLog) => l.status === "FAILED").length;
        const total = d.total ?? 0;
        const pending = Math.max(0, total - sent - failed);
        setStats({ sent: total, delivered: sent, pending, failed });
      } catch (e) {
        console.error("Failed to fetch stats:", e);
      }
    })();
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

  useEffect(() => {
    if (tab === "failed") {
      setStatusFilter("FAILED");
      setPage(1);
    } else if (tab === "history") {
      setStatusFilter("");
      setPage(1);
    }
  }, [tab]);

  useEffect(() => {
    if (tab !== "history" && tab !== "failed") return;

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
  }, [tab, searchLogs, statusFilter, page]);

  useEffect(() => {
    if (tab !== "scheduled") return;

    const run = async () => {
      setLoadingScheduled(true);
      try {
        const params = new URLSearchParams({
          search: scheduledSearch,
          status: scheduledStatus,
          page: String(scheduledPage),
          limit: String(scheduledLimit),
        });
        const res = await fetch(`/api/sms/scheduled?${params}`);
        const data = await res.json();
        setScheduled(data.items ?? []);
        setScheduledTotal(data.total ?? 0);
      } finally {
        setLoadingScheduled(false);
      }
    };

    run();
  }, [tab, scheduledSearch, scheduledStatus, scheduledPage]);

  function reminderTypeLabel(type: ReminderTypeKey) {
    return REMINDER_TYPES.find((x) => x.value === type)?.label ?? type;
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

  async function onSendTestSMS() {
    if (!testPhone.trim()) {
      setError("Enter a phone number.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/sms/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: testPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send test SMS");
      setSuccess("Test SMS sent successfully (or simulated).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send test SMS.");
    } finally {
      setBusy(false);
    }
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

      const vaccinationDateIso =
        singleForm.reminderType === "VACCINATION_REMINDER"
          ? new Date(singleForm.vaccinationDate).toISOString()
          : undefined;

      const antenatalDateIso =
        singleForm.reminderType === "ANTENATAL_REMINDER"
          ? new Date(singleForm.antenatalDate).toISOString()
          : undefined;

      const followUpDateIso =
        singleForm.reminderType === "FOLLOW_UP_REMINDER"
          ? new Date(singleForm.followUpDate).toISOString()
          : undefined;

      const labDateIso =
        singleForm.reminderType === "LABORATORY_TEST_REMINDER"
          ? new Date(singleForm.laboratoryTestDate).toISOString()
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
          vaccinationDate: vaccinationDateIso,
          antenatalDate: antenatalDateIso,
          followUpDate: followUpDateIso,
          laboratoryTestDate: labDateIso,
          medicationName:
            singleForm.reminderType === "MEDICATION_REMINDER"
              ? singleForm.medicationName
              : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send SMS.");

      setSuccess("SMS sent successfully!");
      setTab("history");
      setPage(1);
      setSearchLogs("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send SMS.");
    } finally {
      setBusy(false);
    }
  }

  async function onSendBulk() {
    const lines = bulk.recipientsText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setError("Enter at least one recipient line.");
      return;
    }

    const recipients = lines
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 2) return null;
        return { patientName: parts[0], phoneNumber: parts[1] };
      })
      .filter(Boolean) as Array<{ patientName: string; phoneNumber: string }>;

    if (recipients.some((r) => !r.patientName || !r.phoneNumber)) {
      setError("Each line must be: Patient Name,Phone Number");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const recipientPayload = recipients.map((r) => {
        const known = patients.find(
          (p) => p.phoneNumber.replace(/\s/g, "") === r.phoneNumber.replace(/\s/g, "")
        );
        return {
          phoneNumber: r.phoneNumber,
          patientName: r.patientName,
          patientId: known?.id,
        };
      });

      const appointmentDateIso =
        bulk.reminderType === "APPOINTMENT_REMINDER"
          ? new Date(`${bulk.appointmentDate}T${bulk.appointmentTime}`).toISOString()
          : undefined;

      const vaccinationDateIso =
        bulk.reminderType === "VACCINATION_REMINDER" ? new Date(bulk.vaccinationDate).toISOString() : undefined;

      const antenatalDateIso =
        bulk.reminderType === "ANTENATAL_REMINDER" ? new Date(bulk.antenatalDate).toISOString() : undefined;

      const followUpDateIso =
        bulk.reminderType === "FOLLOW_UP_REMINDER" ? new Date(bulk.followUpDate).toISOString() : undefined;

      const labDateIso =
        bulk.reminderType === "LABORATORY_TEST_REMINDER"
          ? new Date(bulk.laboratoryTestDate).toISOString()
          : undefined;

      const res = await fetch(`/api/sms/send-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderType: bulk.reminderType,
          recipients: recipientPayload,
          medicationName:
            bulk.reminderType === "MEDICATION_REMINDER" ? bulk.medicationName : undefined,
          appointmentDate: appointmentDateIso,
          vaccinationDate: vaccinationDateIso,
          antenatalDate: antenatalDateIso,
          followUpDate: followUpDateIso,
          laboratoryTestDate: labDateIso,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send bulk SMS.");

      setSuccess("Bulk SMS processing completed.");
      setTab("history");
      setPage(1);
      setSearchLogs("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send bulk SMS.");
    } finally {
      setBusy(false);
    }
  }

  function reminderTypeForSelect(type: ReminderTypeKey) {
    return REMINDER_TYPES.find((t) => t.value === type)?.value ?? type;
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

      setSuccess("Scheduled reminder created.");
      setTab("scheduled");
      setScheduledPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to schedule reminder.");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteScheduled(id: number) {
    if (!confirm("Delete this scheduled reminder?")) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/sms/scheduled/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete.");
      setSuccess("Scheduled reminder deleted.");
      setScheduledPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete.");
    } finally {
      setBusy(false);
    }
  }

  async function onSendDueNow() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/sms/scheduled/send-due`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send due reminders.");
      setSuccess(`Processed due reminders: ${data.processed ?? 0}`);
      setTab("history");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send due reminders.");
    } finally {
      setBusy(false);
    }
  }

  const totalPages = Math.ceil(total / limit);
  const scheduledPages = Math.ceil(scheduledTotal / scheduledLimit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMS & Reminders"
        description="Send, schedule, and track SMS reminders for patients"
      />

      {/* Redesign placeholder: primary tabs + stats will be implemented next. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Tabs value={tab} onChange={setTab} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-8-4h8M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          label="SMS Sent"
          value={stats.sent}
          color="blue"
        />
        <SummaryCard
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Delivered"
          value={stats.delivered}
          color="green"
        />
        <SummaryCard
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Pending"
          value={stats.pending}
          color="amber"
        />
        <SummaryCard
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Failed"
          value={stats.failed}
          color="red"
        />
      </div>

      {/* Alerts */}
      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-start gap-3">
          <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">{success}</div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 flex items-start gap-3">
          <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <Tabs value={tab} onChange={setTab} />
      </div>

      {/* Test SMS Card */}
      <Card>
        <CardHeader
          title="Test SMS"
          description="Send a sample SMS to verify delivery (ADMIN login required)."
          action={
            <Button size="sm" onClick={onSendDueNow} loading={busy}>
              Send Due Now
            </Button>
          }
        />
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Phone Number"
                required
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+233XXXXXXXXX"
              />
            </div>
            <Button onClick={onSendTestSMS} loading={busy}>
              Send Test SMS
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* Single SMS Tab */}
      {tab === "single" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Send Single SMS" description="Select reminder type and we generate the SMS content automatically." />
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  onSendSingle();
                }}
              >
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Select Patient (optional)</label>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={singleForm.patientId}
                    onChange={(e) => {
                      const id = e.target.value;
                      handleSinglePatientSelect(id);
                      setSingleForm((f) => ({ ...f, patientId: id }));
                    }}
                  >
                    <option value="">Use manual Patient Name & Phone</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.phoneNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Patient Name"
                  required
                  value={singleForm.patientName}
                  onChange={(e) => setSingleForm((f) => ({ ...f, patientName: e.target.value }))}
                  placeholder="e.g. Ama Mensah"
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
                  options={allowedReminderTypes.map((t) => ({ value: t.value, label: t.label }))}
                />

                {singleForm.reminderType === "APPOINTMENT_REMINDER" && (
                  <div className="grid grid-cols-2 gap-4">
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

                <div className="flex gap-3 pt-4">
                  <Button type="submit" loading={busy}>
                    Send SMS
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setTab("history")}>
                    View History
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Message Preview" />
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  label="Generated Message"
                  value={singleForm.messagePreview}
                  readOnly
                  rows={6}
                />
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                  <p className="text-xs font-medium text-blue-700 mb-2">Reminder Type</p>
                  <p className="text-sm font-semibold text-blue-900">{reminderTypeLabel(singleForm.reminderType)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk SMS Tab */}
      {tab === "bulk" && (
        <Card>
          <CardHeader title="Send Bulk SMS" description="Provide one recipient per line: Patient Name,Phone." />
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Select
                  label="Reminder Type"
                  required
                  value={bulk.reminderType}
                  onChange={(e) => setBulk((b) => ({ ...b, reminderType: e.target.value as ReminderTypeKey }))}
                  options={allowedReminderTypes.map((t) => ({ value: t.value, label: t.label }))}
                />

                {bulk.reminderType === "APPOINTMENT_REMINDER" && (
                  <>
                    <Input
                      label="Date"
                      required
                      type="date"
                      value={bulk.appointmentDate}
                      onChange={(e) => setBulk((b) => ({ ...b, appointmentDate: e.target.value }))}
                    />
                    <Input
                      label="Time"
                      required
                      type="time"
                      value={bulk.appointmentTime}
                      onChange={(e) => setBulk((b) => ({ ...b, appointmentTime: e.target.value }))}
                    />
                  </>
                )}

                {bulk.reminderType === "MEDICATION_REMINDER" && (
                  <Input
                    label="Medication Name"
                    required
                    value={bulk.medicationName}
                    onChange={(e) => setBulk((b) => ({ ...b, medicationName: e.target.value }))}
                  />
                )}

                {(bulk.reminderType === "VACCINATION_REMINDER" ||
                  bulk.reminderType === "ANTENATAL_REMINDER" ||
                  bulk.reminderType === "FOLLOW_UP_REMINDER" ||
                  bulk.reminderType === "LABORATORY_TEST_REMINDER") && (
                  <Input
                    label="Date"
                    required
                    type="date"
                    value={
                      bulk.reminderType === "VACCINATION_REMINDER"
                        ? bulk.vaccinationDate
                        : bulk.reminderType === "ANTENATAL_REMINDER"
                          ? bulk.antenatalDate
                          : bulk.reminderType === "FOLLOW_UP_REMINDER"
                            ? bulk.followUpDate
                            : bulk.laboratoryTestDate
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      setBulk((b) => {
                        switch (b.reminderType) {
                          case "VACCINATION_REMINDER":
                            return { ...b, vaccinationDate: v };
                          case "ANTENATAL_REMINDER":
                            return { ...b, antenatalDate: v };
                          case "FOLLOW_UP_REMINDER":
                            return { ...b, followUpDate: v };
                          case "LABORATORY_TEST_REMINDER":
                            return { ...b, laboratoryTestDate: v };
                          default:
                            return b;
                        }
                      });
                    }}
                  />
                )}
              </div>

              <div>
                <Textarea
                  label="Recipients (One per line)"
                  required
                  rows={10}
                  value={bulk.recipientsText}
                  onChange={(e) => setBulk((b) => ({ ...b, recipientsText: e.target.value }))}
                  placeholder="John Doe,+233XXXXXXXXX&#10;Jane Doe,+233YYYYYYYY"
                />
                <p className="text-xs text-slate-500 mt-2">Format: Patient Name,Phone Number</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button loading={busy} type="button" onClick={onSendBulk}>
                Send Bulk SMS
              </Button>
              <Button type="button" variant="secondary" onClick={() => setTab("failed")}>
                View Failed
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SMS History / Failed Tab */}
      {(tab === "history" || tab === "failed") && (
        <Card>
          <CardHeader
            title={tab === "failed" ? "Failed Messages" : "SMS History"}
            description="View all SMS activity with filtering and search"
          />
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1">
                <Input
                  label="Search"
                  value={searchLogs}
                  onChange={(e) => {
                    setSearchLogs(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Patient name or phone…"
                />
              </div>
              <div className="w-full sm:w-52">
                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  options={[
                    { value: "", label: "All" },
                    { value: "SENT", label: "Sent" },
                    { value: "FAILED", label: "Failed" },
                    { value: "PENDING", label: "Pending" },
                  ]}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Patient", "Phone", "Type", "Status", "Sent At"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                        Loading…
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                        No SMS logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{log.patient?.fullName ?? log.patientName ?? "-"}</td>
                        <td className="px-4 py-3 font-mono text-slate-600 text-sm">{log.phoneNumber}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {log.reminderType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={log.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-sm">{formatDateTime(log.sentAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm">
                <span className="text-slate-600">
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

      {/* Scheduled Reminders Tab */}
      {tab === "scheduled" && (
        <Card>
          <CardHeader
            title="Scheduled Reminders"
            description="Create and manage scheduled SMS reminders"
            action={
              <Button size="sm" onClick={onSendDueNow} loading={busy}>
                Send Due Now
              </Button>
            }
          />
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Create Form */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Create Scheduled Reminder</h3>

                <div className="space-y-4">
                  <Select
                    label="Patient"
                    required
                    value={scheduleForm.patientId}
                    onChange={(e) => setScheduleForm((f) => ({ ...f, patientId: e.target.value }))}
                    options={[
                      { value: "", label: "Select patient…" },
                      ...patients.map((p) => ({ value: String(p.id), label: `${p.fullName} (${p.phoneNumber})` })),
                    ]}
                  />

                  <Select
                    label="Reminder Type"
                    required
                    value={scheduleForm.reminderType}
                    onChange={(e) => setScheduleForm((f) => ({ ...f, reminderType: e.target.value as ReminderTypeKey }))}
                    options={allowedReminderTypes.map((t) => ({ value: t.value, label: t.label }))}
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

                  {(scheduleForm.reminderType === "VACCINATION_REMINDER" ||
                    scheduleForm.reminderType === "ANTENATAL_REMINDER" ||
                    scheduleForm.reminderType === "FOLLOW_UP_REMINDER" ||
                    scheduleForm.reminderType === "LABORATORY_TEST_REMINDER") && (
                    <Input
                      label="Date"
                      required
                      type="date"
                      value={
                        scheduleForm.reminderType === "VACCINATION_REMINDER"
                          ? scheduleForm.vaccinationDate
                          : scheduleForm.reminderType === "ANTENATAL_REMINDER"
                            ? scheduleForm.antenatalDate
                            : scheduleForm.reminderType === "FOLLOW_UP_REMINDER"
                              ? scheduleForm.followUpDate
                              : scheduleForm.laboratoryTestDate
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        setScheduleForm((f) => {
                          switch (f.reminderType) {
                            case "VACCINATION_REMINDER":
                              return { ...f, vaccinationDate: v };
                            case "ANTENATAL_REMINDER":
                              return { ...f, antenatalDate: v };
                            case "FOLLOW_UP_REMINDER":
                              return { ...f, followUpDate: v };
                            case "LABORATORY_TEST_REMINDER":
                              return { ...f, laboratoryTestDate: v };
                            default:
                              return f;
                          }
                        });
                      }}
                    />
                  )}

                  <Input
                    label="Send At (Date & Time)"
                    required
                    type="datetime-local"
                    value={scheduleForm.scheduledAt}
                    onChange={(e) => setScheduleForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  />

                  <Button type="button" onClick={onCreateScheduled} loading={busy} className="w-full">
                    Schedule Reminder
                  </Button>
                </div>
              </div>

              {/* List */}
              <div>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1">
                    <Input
                      label="Search"
                      value={scheduledSearch}
                      onChange={(e) => {
                        setScheduledSearch(e.target.value);
                        setScheduledPage(1);
                      }}
                      placeholder="Patient, phone, type…"
                    />
                  </div>
                  <div className="w-full sm:w-40">
                    <Select
                      label="Status"
                      value={scheduledStatus}
                      onChange={(e) => {
                        setScheduledStatus(e.target.value);
                        setScheduledPage(1);
                      }}
                      options={[
                        { value: "", label: "All" },
                        { value: "PENDING", label: "Pending" },
                        { value: "SENT", label: "Sent" },
                        { value: "FAILED", label: "Failed" },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loadingScheduled ? (
                    <div className="text-center py-8 text-slate-400">Loading…</div>
                  ) : scheduled.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">No scheduled reminders</div>
                  ) : (
                    scheduled.map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm">{item.patientName}</p>
                            <p className="text-xs text-slate-600 font-mono mt-1">{item.phoneNumber}</p>
                            <p className="text-xs text-slate-500 mt-2">
                              <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5">{item.reminderType}</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-2">Scheduled: {formatDateTime(item.scheduledAt)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge status={item.status} />
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => onDeleteScheduled(item.id)}
                              disabled={busy}
                              className="whitespace-nowrap"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {scheduledPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      Page {scheduledPage} of {scheduledPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={scheduledPage === 1}
                        onClick={() => setScheduledPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={scheduledPage === scheduledPages}
                        onClick={() => setScheduledPage((p) => Math.min(scheduledPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
