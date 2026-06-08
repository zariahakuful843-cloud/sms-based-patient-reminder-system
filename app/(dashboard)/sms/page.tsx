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
  messageType: string;
  deliveryStatus: string;
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

function buildPreview(params: {
  reminderType: ReminderTypeKey;
  patientName: string;
  appointmentDate?: Date;
  vaccinationDate?: Date;
  antenatalDate?: Date;
  followUpDate?: Date;
  laboratoryTestDate?: Date;
  medicationName?: string;
}) {
  const patientName = params.patientName;
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  switch (params.reminderType) {
    case "APPOINTMENT_REMINDER": {
      const dt = params.appointmentDate ?? new Date();
      return `Dear ${patientName}, this is a reminder that you have an appointment on ${formatDate(
        dt
      )} at ${formatTime(dt)}. Please arrive 15 minutes early.`;
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
      return `Dear ${patientName}, this is a reminder for your antenatal visit on ${formatDate(
        d
      )}. We look forward to seeing you.`;
    }
    case "FOLLOW_UP_REMINDER": {
      const d = params.followUpDate ?? new Date();
      return `Dear ${patientName}, this is a reminder for your follow-up visit on ${formatDate(
        d
      )}. Please contact the facility if you need to reschedule.`;
    }
    case "LABORATORY_TEST_REMINDER": {
      const d = params.laboratoryTestDate ?? new Date();
      return `Dear ${patientName}, your laboratory test is scheduled for ${formatDate(
        d
      )}. Please arrive on time and follow any preparation instructions.`;
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
  const [tab, setTab] = useState<
    "single" | "bulk" | "history" | "scheduled" | "failed"
  >("single");

  const [patients, setPatients] = useState<Patient[]>([]);

  // Shared log state
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchLogs, setSearchLogs] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Feedback
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Test SMS
  const [testPhone, setTestPhone] = useState("");

  // Send Single SMS form (required fields)
  const [singleForm, setSingleForm] = useState({
    patientId: "",
    reminderType: "APPOINTMENT_REMINDER" as ReminderTypeKey,
    phoneNumber: "",
    patientName: "",
    messagePreview: "",
    // optional fields by type
    appointmentDate: toISODate(new Date()),
    appointmentTime: toTimeValue(new Date()),
    medicationName: "",
    vaccinationDate: toISODate(new Date()),
    antenatalDate: toISODate(new Date()),
    followUpDate: toISODate(new Date()),
    laboratoryTestDate: toISODate(new Date()),
  });

  // Send Bulk SMS
  const [bulk, setBulk] = useState({
    reminderType: "APPOINTMENT_REMINDER" as ReminderTypeKey,
    recipientsText:
      "John Doe,+233XXXXXXXXX\nJane Doe,+233YYYYYYYY\n",
    appointmentDate: toISODate(new Date()),
    appointmentTime: toTimeValue(new Date()),
    medicationName: "",
    vaccinationDate: toISODate(new Date()),
    antenatalDate: toISODate(new Date()),
    followUpDate: toISODate(new Date()),
    laboratoryTestDate: toISODate(new Date()),
    sendAsKnownPatients: true,
  });

  // Scheduled reminders
  const [scheduled, setScheduled] = useState<ScheduledReminder[]>([]);
  const [scheduledTotal, setScheduledTotal] = useState(0);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [scheduledSearch, setScheduledSearch] = useState("");
  const [scheduledStatus, setScheduledStatus] = useState("");
  const [scheduledPage, setScheduledPage] = useState(1);
  const scheduledLimit = 10;

  const [scheduleForm, setScheduleForm] = useState({
    patientId: "",
    reminderType: "APPOINTMENT_REMINDER" as ReminderTypeKey,
    scheduledAt: new Date().toISOString().slice(0, 16), // datetime-local compatible
    phoneNumber: "",
    message: "",
    // for preview
    appointmentDate: toISODate(new Date()),
    appointmentTime: toTimeValue(new Date()),
    medicationName: "",
    vaccinationDate: toISODate(new Date()),
    antenatalDate: toISODate(new Date()),
    followUpDate: toISODate(new Date()),
    laboratoryTestDate: toISODate(new Date()),
  });

  const computedSinglePreview = useMemo(() => {
    const name = singleForm.patientName || "";
    const dt = new Date(`${singleForm.appointmentDate}T${singleForm.appointmentTime}`);
    return buildPreview({
      reminderType: singleForm.reminderType,
      patientName: name,
      appointmentDate: singleForm.reminderType === "APPOINTMENT_REMINDER" ? dt : undefined,
      medicationName: singleForm.medicationName,
      vaccinationDate:
        singleForm.reminderType === "VACCINATION_REMINDER" ? new Date(singleForm.vaccinationDate) : undefined,
      antenatalDate:
        singleForm.reminderType === "ANTENATAL_REMINDER" ? new Date(singleForm.antenatalDate) : undefined,
      followUpDate:
        singleForm.reminderType === "FOLLOW_UP_REMINDER" ? new Date(singleForm.followUpDate) : undefined,
      laboratoryTestDate:
        singleForm.reminderType === "LABORATORY_TEST_REMINDER" ? new Date(singleForm.laboratoryTestDate) : undefined,
    });
  }, [singleForm]);

  useEffect(() => {
    setSingleForm((f) => ({ ...f, messagePreview: computedSinglePreview }));
  }, [computedSinglePreview]);

  useEffect(() => {
    setScheduleForm((f) => ({ ...f, message: "" }));
    // message computed on create from selected patient/type; keep simple here
  }, []);

  async function fetchPatients() {
    const r = await fetch(`/api/patients?limit=200`);
    const d = await r.json();
    setPatients(d.patients ?? []);
  }

  async function fetchLogsPage(newPage: number) {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams({
        search: searchLogs,
        status: statusFilter,
        page: String(newPage),
        limit: String(limit),
      });
      const res = await fetch(`/api/sms/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function fetchScheduled() {
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
  }

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (tab === "history" || tab === "failed") {
      const st = tab === "failed" ? "FAILED" : "";
      setStatusFilter(st);
      setPage(1);
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "history" || tab === "failed") {
      fetchLogsPage(page);
    }
  }, [tab, page, statusFilter]);

  useEffect(() => {
    if (tab === "scheduled") {
      fetchScheduled();
    }
  }, [tab, scheduledPage, scheduledSearch, scheduledStatus]);

  function reminderTypeForLabel(value: ReminderTypeKey) {
    return REMINDER_TYPES.find((x) => x.value === value)?.label ?? value;
  }

  function handleSinglePatientChange(patientId: string) {
    const p = patients.find((pt) => String(pt.id) === patientId);
    const patientName = p ? safeFirstName(p.fullName) : "";
    setSingleForm((f) => ({
      ...f,
      patientId,
      patientName,
      phoneNumber: p?.phoneNumber ?? "",
    }));
  }

  function handleSchedulePatientChange(patientId: string) {
    const p = patients.find((pt) => String(pt.id) === patientId);
    setScheduleForm((f) => ({
      ...f,
      patientId,
      phoneNumber: p?.phoneNumber ?? "",
    }));
  }

  function computeSchedulePreview(): string {
    const patient = patients.find((pt) => String(pt.id) === scheduleForm.patientId);
    const patientName = patient ? safeFirstName(patient.fullName) : "";

    const dt = new Date(`${scheduleForm.appointmentDate}T${scheduleForm.appointmentTime}`);

    return buildPreview({
      reminderType: scheduleForm.reminderType,
      patientName,
      appointmentDate:
        scheduleForm.reminderType === "APPOINTMENT_REMINDER" ? dt : undefined,
      medicationName: scheduleForm.medicationName,
      vaccinationDate:
        scheduleForm.reminderType === "VACCINATION_REMINDER" ? new Date(scheduleForm.vaccinationDate) : undefined,
      antenatalDate:
        scheduleForm.reminderType === "ANTENATAL_REMINDER" ? new Date(scheduleForm.antenatalDate) : undefined,
      followUpDate:
        scheduleForm.reminderType === "FOLLOW_UP_REMINDER" ? new Date(scheduleForm.followUpDate) : undefined,
      laboratoryTestDate:
        scheduleForm.reminderType === "LABORATORY_TEST_REMINDER" ? new Date(scheduleForm.laboratoryTestDate) : undefined,
    });
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
    if (!singleForm.patientId || !singleForm.patientName || !singleForm.phoneNumber) {
      setError("Patient Name and Phone Number are required.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/sms/send-single`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: parseInt(singleForm.patientId),
          phoneNumber: singleForm.phoneNumber,
          patientName: singleForm.patientName,
          reminderType: singleForm.reminderType,
          appointmentDate:
            singleForm.reminderType === "APPOINTMENT_REMINDER"
              ? `${singleForm.appointmentDate}T${singleForm.appointmentTime}`
              : undefined,
          vaccinationDate:
            singleForm.reminderType === "VACCINATION_REMINDER"
              ? singleForm.vaccinationDate
              : undefined,
          antenatalDate:
            singleForm.reminderType === "ANTENATAL_REMINDER"
              ? singleForm.antenatalDate
              : undefined,
          followUpDate:
            singleForm.reminderType === "FOLLOW_UP_REMINDER"
              ? singleForm.followUpDate
              : undefined,
          laboratoryTestDate:
            singleForm.reminderType === "LABORATORY_TEST_REMINDER"
              ? singleForm.laboratoryTestDate
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
      setTab("history");
      setSearchLogs("");
      setPage(1);
      fetchLogsPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send SMS.");
    } finally {
      setBusy(false);
    }
  }

  async function onSendBulk() {
    // recipients format: "Patient Name,Phone"
    const lines = bulk.recipientsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

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

    // Backend requires patientId for persistence.
    // We'll resolve patientId when possible; otherwise backend will fail persistence.
    const recipientPayload = recipients.map((r) => {
      const known = patients.find((p) => p.phoneNumber.replace(/\s/g, "") === r.phoneNumber.replace(/\s/g, ""));
      return {
        phoneNumber: r.phoneNumber,
        patientName: r.patientName,
        patientId: known?.id,
      };
    });

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/sms/send-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderType: bulk.reminderType,
          recipients: recipientPayload,
          medicationName: bulk.reminderType === "MEDICATION_REMINDER" ? bulk.medicationName : undefined,
          appointmentDate: bulk.reminderType === "APPOINTMENT_REMINDER" ? `${bulk.appointmentDate}T${bulk.appointmentTime}` : undefined,
          vaccinationDate: bulk.reminderType === "VACCINATION_REMINDER" ? bulk.vaccinationDate : undefined,
          antenatalDate: bulk.reminderType === "ANTENATAL_REMINDER" ? bulk.antenatalDate : undefined,
          followUpDate: bulk.reminderType === "FOLLOW_UP_REMINDER" ? bulk.followUpDate : undefined,
          laboratoryTestDate: bulk.reminderType === "LABORATORY_TEST_REMINDER" ? bulk.laboratoryTestDate : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send bulk SMS.");

      setSuccess("Bulk SMS processing completed." );
      setTab("history");
      setPage(1);
      fetchLogsPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send bulk SMS.");
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
      const message = computeSchedulePreview();
      const res = await fetch(`/api/sms/scheduled`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          reminderType: scheduleForm.reminderType,
          phoneNumber: patient.phoneNumber,
          patientName: safeFirstName(patient.fullName),
          message,
          scheduledAt: scheduledAt.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule reminder.");

      setSuccess("Scheduled reminder created." );
      setTab("scheduled");
      setScheduledPage(1);
      fetchScheduled();
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
      setSuccess("Scheduled reminder deleted." );
      fetchScheduled();
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
      fetchLogsPage(1);
      fetchScheduled();
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

      {/* Test SMS (always visible for admins) */}
      <Card>
        <CardHeader
          title="Test SMS"
          description="Send a sample SMS to verify delivery (requires ADMIN login)."
          action={<Button size="sm" onClick={onSendDueNow} disabled={busy}>Send Due Now</Button>}
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
          <CardHeader title="Send Single SMS" description="Generate SMS content automatically based on reminder type." />
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
                  onChange={(e) =>
                    setSingleForm((f) => ({
                      ...f,
                      reminderType: e.target.value as ReminderTypeKey,
                    }))
                  }
                  options={REMINDER_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Select Patient (optional for phone autofill)</label>
                <select
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={singleForm.patientId}
                  onChange={(e) => {
                    const id = e.target.value;
                    handleSinglePatientChange(id);
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

              {/* Type-specific fields */}
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

              {/* Preview */}
              <div className="md:col-span-2">
                <Textarea label="Message Preview" value={singleForm.messagePreview} readOnly rows={4} required />
                <div className="text-xs text-slate-400 mt-1">Reminder: {reminderTypeForLabel(singleForm.reminderType)}</div>
              </div>

              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" loading={busy}>
                  Send SMS
                </Button>
                <Button type="button" variant="secondary" onClick={() => setTab("history")}>View History</Button>
              </div>
            </form>

            <div className="mt-4 text-xs text-slate-500">
              Note: Backend persists logs using <span className="font-semibold">patientId</span>. If you select a patient above, phone and patientId will be linked automatically.
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "bulk" && (
        <Card>
          <CardHeader title="Send Bulk SMS" description="Send SMS to many recipients. Provide one recipient per line: Patient Name,Phone." />
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
                  placeholder="e.g. Metformin 500mg"
                />
              )}

              {bulk.reminderType === "VACCINATION_REMINDER" && (
                <Input
                  label="Date"
                  required
                  type="date"
                  value={bulk.vaccinationDate}
                  onChange={(e) => setBulk((b) => ({ ...b, vaccinationDate: e.target.value }))}
                />
              )}

              {bulk.reminderType === "ANTENATAL_REMINDER" && (
                <Input
                  label="Date"
                  required
                  type="date"
                  value={bulk.antenatalDate}
                  onChange={(e) => setBulk((b) => ({ ...b, antenatalDate: e.target.value }))}
                />
              )}

              {bulk.reminderType === "FOLLOW_UP_REMINDER" && (
                <Input
                  label="Date"
                  required
                  type="date"
                  value={bulk.followUpDate}
                  onChange={(e) => setBulk((b) => ({ ...b, followUpDate: e.target.value }))}
                />
              )}

              {bulk.reminderType === "LABORATORY_TEST_REMINDER" && (
                <Input
                  label="Date"
                  required
                  type="date"
                  value={bulk.laboratoryTestDate}
                  onChange={(e) => setBulk((b) => ({ ...b, laboratoryTestDate: e.target.value }))}
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
                <div className="text-xs text-slate-400 mt-1">
                  Backend persistence needs patientId. If a phone number matches an existing Patient, it will be linked automatically.
                </div>
              </div>

              <div className="md:col-span-2 flex gap-3">
                <Button onClick={onSendBulk} loading={busy} type="button">
                  Send Bulk SMS
                </Button>
                <Button type="button" variant="secondary" onClick={() => setTab("failed")}>View Failed</Button>
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
                    {[
                      "Patient",
                      "Phone",
                      "Type",
                      "Message",
                      "Status",
                      "Date Sent",
                    ].map((h) => (
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
                            {log.messageType}
                          </span>
                        </td>
                        <td className="max-w-xs px-4 py-3 text-slate-600">
                          <p className="truncate">{log.message}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={log.deliveryStatus} />
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
            action={
              <Button size="sm" onClick={onSendDueNow} loading={busy}>
                Send Due Now
              </Button>
            }
          />
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create */}
              <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Create Scheduled Reminder</h3>

                <div className="mt-4 space-y-4">
                  <Select
                    label="Patient"
                    required
                    value={scheduleForm.patientId}
                    onChange={(e) => handleSchedulePatientChange(e.target.value)}
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
                      value={(() => {
                        switch (scheduleForm.reminderType) {
                          case "VACCINATION_REMINDER":
                            return scheduleForm.vaccinationDate;
                          case "ANTENATAL_REMINDER":
                            return scheduleForm.antenatalDate;
                          case "FOLLOW_UP_REMINDER":
                            return scheduleForm.followUpDate;
                          case "LABORATORY_TEST_REMINDER":
                            return scheduleForm.laboratoryTestDate;
                          default:
                            return toISODate(new Date());
                        }
                      })()}
                      onChange={(e) => {
                        const val = e.target.value;
                        setScheduleForm((f) => {
                          switch (f.reminderType) {
                            case "VACCINATION_REMINDER":
                              return { ...f, vaccinationDate: val };
                            case "ANTENATAL_REMINDER":
                              return { ...f, antenatalDate: val };
                            case "FOLLOW_UP_REMINDER":
                              return { ...f, followUpDate: val };
                            case "LABORATORY_TEST_REMINDER":
                              return { ...f, laboratoryTestDate: val };
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
                    value={computeSchedulePreview()}
                    readOnly
                    rows={4}
                  />

                  <Button type="button" onClick={onCreateScheduled} loading={busy}>
                    Create Scheduled Reminder
                  </Button>
                </div>
              </div>

              {/* List */}
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
                        {[
                          "Patient",
                          "Phone",
                          "Type",
                          "Message",
                          "Status",
                          "Scheduled At",
                          "Actions",
                        ].map((h) => (
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
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => onDeleteScheduled(item.id)}
                                disabled={busy}
                              >
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

