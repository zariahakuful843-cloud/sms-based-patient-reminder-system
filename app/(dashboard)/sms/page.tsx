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

  // ... This is inside the big block above:
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
// ... And then it moves straight on to handleDeleteScheduledReminder right below it!

