import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-GH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function calculateAge(dateOfBirth: Date | string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700",
    MISSED: "bg-amber-100 text-amber-700",
    SENT: "bg-emerald-100 text-emerald-700",
    FAILED: "bg-red-100 text-red-700",
    PENDING: "bg-amber-100 text-amber-700",
    SIMULATED: "bg-purple-100 text-purple-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-700";
}
