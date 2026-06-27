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
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ring-1 ring-inset ${
            value === it.value
              ? "bg-blue-600 text-white ring-blue-600"
              : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
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
        description="Send, schedule, and track SMS reminders"
      />

      <Tabs value={tab} onChange={setTab} />

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
          {success && (
            <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
              {success}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {tab === "single" && (
        <Card>
          <CardHeader
            title="Send Single SMS"
            description="Select reminder type and we generate the SMS content automatically."
          />
          <CardContent>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                onSendSingle();
              }}
            >
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

              <div className="md:col-span-2">
                <Select
                  label="Reminder Type"
                  required
                  value={singleForm.reminderType}
                  onChange={(e) => setSingleForm((f) => ({ ...f, reminderType: e.target.value as ReminderTypeKey }))}
                  options={REMINDER_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Select Patient (optional)</label>
                <select
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {singleForm.reminderType === "APPOINTMENT_REMINDER" && (
                <>
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
                </>
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

              <div className="md:col-span-2">
                <Textarea
                  label="Message Preview"
                  value={singleForm.messagePreview}
                  readOnly
                  rows={4}
                  required
                />
                <div className="text-xs text-slate-400 mt-1">{reminderTypeLabel(singleForm.reminderType)}</div>
              </div>

              <div className="md:col-span-2 flex gap-3">
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
      )}

      {tab === "bulk" && (
        <Card>
          <CardHeader
            title="Send Bulk SMS"
            description="Provide one recipient per line: Patient Name,Phone."
          />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Reminder Type"
                required
                value={bulk.reminderType}
                onChange={(e) => setBulk((b) => ({ ...b, reminderType: e.target.value as ReminderTypeKey }))}
                options={REMINDER_TYPES.map((t) => ({ value: t.value, label: t.label }))}
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

              <div className="md:col-span-2">
                <Textarea
                  label="Recipients"
                  required
                  rows={6}
                  value={bulk.recipientsText}
                  onChange={(e) => setBulk((b) => ({ ...b, recipientsText: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <Button loading={busy} type="button" onClick={onSendBulk}>
                  Send Bulk SMS
                </Button>
                <Button type="button" variant="secondary" onClick={() => setTab("failed")}>
                  View Failed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "history" || tab === "failed" ? (
        <Card>
          <CardHeader
            title={tab === "failed" ? "Failed Messages" : "SMS History"}
            description="View all SMS logs."
          />
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
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

            <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {["Patient", "Phone", "Type", "Message", "Status", "Date Sent"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                        Loading…
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                        No SMS logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {log.patient?.fullName ?? log.patientName ?? "-"}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">{log.phoneNumber}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {log.reminderType}
                          </span>
                        </td>
                        <td className="max-w-xs px-4 py-3 text-slate-600">
                          <p className="truncate">{log.message}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={log.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-500">{formatDateTime(log.sentAt)}</td>
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
      ) : null}

      {tab === "scheduled" && (
        <Card>
          <CardHeader
            title="Scheduled Reminders"
            description="Create reminders and manage scheduled sends."
            action={<Button size="sm" onClick={onSendDueNow} loading={busy}>Send Due Now</Button>}
          />
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Create Scheduled Reminder</h3>

                <div className="mt-4 space-y-4">
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
                    options={REMINDER_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                  />

                  {scheduleForm.reminderType === "APPOINTMENT_REMINDER" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Appointment Date"
                        required
                        type="date"
                        value={scheduleForm.appointmentDate}
                        onChange={(e) => setScheduleForm((f) => ({ ...f, appointmentDate: e.target.value }))}
                      />
                      <Input
                        label="Appointment Time"
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
                    label="Scheduled At"
                    required
                    type="datetime-local"
                    value={scheduleForm.scheduledAt}
                    onChange={(e) => setScheduleForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  />

                  <Textarea
                    label="Message Preview"
                    value={(() => {
                      const patient = patients.find((p) => String(p.id) === scheduleForm.patientId);
                      return patient ? schedulePreview(safeFirstName(patient.fullName)) : "";
                    })()}
                    readOnly
                    rows={4}
                  />

                  <Button type="button" onClick={onCreateScheduled} loading={busy}>
                    Create Scheduled Reminder
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
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
                  <div className="w-full sm:w-52">
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

                <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-slate-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Patient", "Phone", "Type", "Message", "Status", "Scheduled At", "Actions"].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingScheduled ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                            Loading…
                          </td>
                        </tr>
                      ) : scheduled.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                            No scheduled reminders.
                          </td>
                        </tr>
                      ) : (
                        scheduled.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">{item.patientName}</td>
                            <td className="px-4 py-3 font-mono text-slate-600">{item.phoneNumber}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                {item.reminderType}
                              </span>
                            </td>
                            <td className="max-w-xs px-4 py-3 text-slate-600">
                              <p className="truncate">{item.message}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge status={item.status} />
                            </td>
                            <td className="px-4 py-3 text-slate-500">{formatDateTime(item.scheduledAt)}</td>
                            <td className="px-4 py-3">
                              <Button variant="danger" size="sm" onClick={() => onDeleteScheduled(item.id)} disabled={busy}>
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {scheduledPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Showing {(scheduledPage - 1) * scheduledLimit + 1}–{Math.min(scheduledPage * scheduledLimit, scheduledTotal)} of {scheduledTotal}
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

