export type PatientStatus = "active" | "inactive" | "opted-out";
export type AppointmentStatus = "scheduled" | "confirmed" | "cancelled" | "no-show" | "completed";
export type AppointmentType = "consultation" | "follow-up" | "lab" | "procedure";
export type ReminderStatus = "pending" | "sent" | "delivered" | "failed";

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dob: string;
  provider: string;
  status: PatientStatus;
  noShowCount: number;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  provider: string;
  type: AppointmentType;
  date: string;
  time: string;
  status: AppointmentStatus;
  remindersSent: number;
  lastReminder?: string;
  notes?: string;
}

export interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  timing: string;
  active: boolean;
  sentCount: number;
  lastUsed?: string;
}

export const patients: Patient[] = [
  { id: "p1", name: "Sarah Johnson", phone: "+1 (555) 201-4831", email: "sjohnson@email.com", dob: "1985-03-14", provider: "Dr. Martinez", status: "active", noShowCount: 0, createdAt: "2026-01-10" },
  { id: "p2", name: "Michael Chen", phone: "+1 (555) 349-7722", dob: "1972-11-02", provider: "Dr. Patel", status: "active", noShowCount: 1, createdAt: "2026-01-15" },
  { id: "p3", name: "Linda Okafor", phone: "+1 (555) 488-2200", email: "lindao@email.com", dob: "1990-07-28", provider: "Dr. Martinez", status: "active", noShowCount: 0, createdAt: "2026-02-01" },
  { id: "p4", name: "Robert Tran", phone: "+1 (555) 612-9045", dob: "1968-05-19", provider: "Dr. Williams", status: "active", noShowCount: 3, createdAt: "2025-11-20" },
  { id: "p5", name: "Emily Rodriguez", phone: "+1 (555) 723-1188", email: "emily.r@email.com", dob: "1995-09-04", provider: "Dr. Patel", status: "active", noShowCount: 0, createdAt: "2026-03-05" },
  { id: "p6", name: "David Park", phone: "+1 (555) 815-3374", dob: "1980-12-22", provider: "Dr. Williams", status: "inactive", noShowCount: 2, createdAt: "2025-09-14" },
  { id: "p7", name: "Amanda Foster", phone: "+1 (555) 901-6612", email: "afoster@email.com", dob: "1988-04-11", provider: "Dr. Martinez", status: "active", noShowCount: 0, createdAt: "2026-04-02" },
  { id: "p8", name: "James Wilson", phone: "+1 (555) 234-8891", dob: "1955-08-30", provider: "Dr. Patel", status: "opted-out", noShowCount: 4, createdAt: "2025-06-01" },
  { id: "p9", name: "Maria Santos", phone: "+1 (555) 467-2200", email: "msantos@email.com", dob: "1993-01-17", provider: "Dr. Williams", status: "active", noShowCount: 1, createdAt: "2026-02-20" },
  { id: "p10", name: "Thomas Anderson", phone: "+1 (555) 580-4433", dob: "1961-06-09", provider: "Dr. Martinez", status: "active", noShowCount: 0, createdAt: "2026-04-18" },
];

export const appointments: Appointment[] = [
  { id: "a1", patientId: "p1", patientName: "Sarah Johnson", provider: "Dr. Martinez", type: "consultation", date: "2026-05-24", time: "09:00 AM", status: "confirmed", remindersSent: 2, lastReminder: "2026-05-23" },
  { id: "a2", patientId: "p3", patientName: "Linda Okafor", provider: "Dr. Martinez", type: "follow-up", date: "2026-05-24", time: "10:30 AM", status: "scheduled", remindersSent: 1, lastReminder: "2026-05-22" },
  { id: "a3", patientId: "p5", patientName: "Emily Rodriguez", provider: "Dr. Patel", type: "lab", date: "2026-05-24", time: "11:15 AM", status: "confirmed", remindersSent: 2, lastReminder: "2026-05-23" },
  { id: "a4", patientId: "p2", patientName: "Michael Chen", provider: "Dr. Patel", type: "consultation", date: "2026-05-25", time: "02:00 PM", status: "scheduled", remindersSent: 1, lastReminder: "2026-05-22" },
  { id: "a5", patientId: "p9", patientName: "Maria Santos", provider: "Dr. Williams", type: "procedure", date: "2026-05-25", time: "03:30 PM", status: "scheduled", remindersSent: 1, lastReminder: "2026-05-23" },
  { id: "a6", patientId: "p4", patientName: "Robert Tran", provider: "Dr. Williams", type: "follow-up", date: "2026-05-20", time: "09:30 AM", status: "no-show", remindersSent: 3, lastReminder: "2026-05-19" },
  { id: "a7", patientId: "p7", patientName: "Amanda Foster", provider: "Dr. Martinez", type: "consultation", date: "2026-05-21", time: "01:00 PM", status: "completed", remindersSent: 2, lastReminder: "2026-05-20" },
  { id: "a8", patientId: "p10", patientName: "Thomas Anderson", provider: "Dr. Martinez", type: "follow-up", date: "2026-05-26", time: "10:00 AM", status: "scheduled", remindersSent: 0 },
  { id: "a9", patientId: "p6", patientName: "David Park", provider: "Dr. Williams", type: "lab", date: "2026-05-19", time: "08:00 AM", status: "cancelled", remindersSent: 2, lastReminder: "2026-05-18" },
  { id: "a10", patientId: "p1", patientName: "Sarah Johnson", provider: "Dr. Martinez", type: "procedure", date: "2026-05-27", time: "02:30 PM", status: "scheduled", remindersSent: 0 },
];

export const smsTemplates: SmsTemplate[] = [
  {
    id: "t1",
    name: "7-Day Advance Reminder",
    body: "Hi {{patient_name}}, this is a reminder that you have an appointment with {{provider}} on {{date}} at {{time}}. Reply 1 to confirm, 2 to cancel, or 3 to reschedule. Reply STOP to opt out.",
    timing: "7 days before",
    active: true,
    sentCount: 1240,
    lastUsed: "2026-05-23",
  },
  {
    id: "t2",
    name: "48-Hour Reminder",
    body: "Hi {{patient_name}}, your appointment with {{provider}} is in 2 days on {{date}} at {{time}} at {{location}}. Reply 1 to confirm, 2 to cancel. Questions? Call us at (555) 800-1234.",
    timing: "48 hours before",
    active: true,
    sentCount: 2890,
    lastUsed: "2026-05-23",
  },
  {
    id: "t3",
    name: "24-Hour Final Reminder",
    body: "Reminder: {{patient_name}}, your appointment with {{provider}} is TOMORROW at {{time}}. Please arrive 10 minutes early. Reply 1 to confirm or call (555) 800-1234 to reschedule.",
    timing: "24 hours before",
    active: true,
    sentCount: 2750,
    lastUsed: "2026-05-23",
  },
  {
    id: "t4",
    name: "2-Hour Day-Of Reminder",
    body: "Hi {{patient_name}}, your appointment with {{provider}} is in 2 hours at {{time}}. See you soon at {{location}}!",
    timing: "2 hours before",
    active: false,
    sentCount: 480,
    lastUsed: "2026-05-10",
  },
  {
    id: "t5",
    name: "Post-Visit Thank You",
    body: "Thank you for visiting us today, {{patient_name}}! We hope your appointment with {{provider}} was great. For questions, call (555) 800-1234. Have a healthy day!",
    timing: "After appointment",
    active: true,
    sentCount: 610,
    lastUsed: "2026-05-22",
  },
];

export const monthlyNoShowData = [
  { month: "Jun '25", noShow: 28, total: 210 },
  { month: "Jul '25", noShow: 31, total: 198 },
  { month: "Aug '25", noShow: 24, total: 225 },
  { month: "Sep '25", noShow: 22, total: 240 },
  { month: "Oct '25", noShow: 19, total: 235 },
  { month: "Nov '25", noShow: 17, total: 218 },
  { month: "Dec '25", noShow: 15, total: 190 },
  { month: "Jan '26", noShow: 18, total: 245 },
  { month: "Feb '26", noShow: 14, total: 260 },
  { month: "Mar '26", noShow: 12, total: 275 },
  { month: "Apr '26", noShow: 11, total: 280 },
  { month: "May '26", noShow: 9, total: 265 },
];

export const dashboardStats = {
  remindersSentToday: 47,
  confirmationRate: 76,
  pendingConfirmations: 23,
  noShowsThisMonth: 9,
  totalPatients: 10,
  activeAppointmentsThisWeek: 8,
  reminderDeliveryRate: 98.2,
  avgResponseTime: "14 min",
};
