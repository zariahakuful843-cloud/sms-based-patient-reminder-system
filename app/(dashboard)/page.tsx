import { prisma } from "@/lib/prisma";
import { Users, Calendar, MessageSquare, Bell } from "lucide-react";
import Link from "next/link";

async function getStats() {
  const [patientCount, appointmentCount, messageCount, reminderCount] =
    await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count({ where: { status: "SCHEDULED" } }),
      prisma.message.count({ where: { status: "SENT" } }),
      prisma.reminder.count({ where: { status: "PENDING" } }),
    ]);

  const recentAppointments = await prisma.appointment.findMany({
    where: { status: "SCHEDULED" },
    include: { patient: true },
    orderBy: { appointmentDate: "asc" },
    take: 5,
  });

  const recentMessages = await prisma.message.findMany({
    include: { patient: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    patientCount,
    appointmentCount,
    messageCount,
    reminderCount,
    recentAppointments,
    recentMessages,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const kpis = [
    {
      label: "Total Patients",
      value: stats.patientCount,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      href: "/patients",
    },
    {
      label: "Scheduled Appointments",
      value: stats.appointmentCount,
      icon: Calendar,
      color: "bg-emerald-100 text-emerald-600",
      href: "/appointments",
    },
    {
      label: "Messages Sent",
      value: stats.messageCount,
      icon: MessageSquare,
      color: "bg-purple-100 text-purple-600",
      href: "/messages",
    },
    {
      label: "Pending Reminders",
      value: stats.reminderCount,
      icon: Bell,
      color: "bg-amber-100 text-amber-600",
      href: "/reminders",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Overview of your patient reminder system
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${kpi.color}`}
              >
                <kpi.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
                <p className="text-sm text-slate-500">{kpi.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Upcoming Appointments
          </h3>
          {stats.recentAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming appointments</p>
          ) : (
            <div className="space-y-3">
              {stats.recentAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {apt.patient.name}
                    </p>
                    <p className="text-xs text-slate-500">{apt.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">
                      {new Date(apt.appointmentDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(apt.appointmentDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Recent Messages
          </h3>
          {stats.recentMessages.length === 0 ? (
            <p className="text-sm text-slate-500">No messages sent yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {msg.patient.name}
                    </p>
                    <p className="max-w-[200px] truncate text-xs text-slate-500">
                      {msg.content}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      msg.status === "DELIVERED"
                        ? "bg-green-100 text-green-700"
                        : msg.status === "SENT"
                          ? "bg-blue-100 text-blue-700"
                          : msg.status === "FAILED"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {msg.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
