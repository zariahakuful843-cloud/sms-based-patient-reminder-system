"use client";

import { useState } from "react";
import { appointments, Appointment } from "@/lib/data";

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  scheduled: "bg-blue-100 text-blue-700",
  "no-show": "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
  completed: "bg-purple-100 text-purple-700",
};

const typeColors: Record<string, string> = {
  consultation: "bg-teal-50 text-teal-700",
  "follow-up": "bg-indigo-50 text-indigo-700",
  lab: "bg-cyan-50 text-cyan-700",
  procedure: "bg-orange-50 text-orange-700",
};

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const filtered = appointments.filter((a) => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchType = typeFilter === "all" || a.type === typeFilter;
    return matchStatus && matchType;
  });

  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  const statusCounts = {
    scheduled: appointments.filter((a) => a.status === "scheduled").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    "no-show": appointments.filter((a) => a.status === "no-show").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
    completed: appointments.filter((a) => a.status === "completed").length,
  };

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 mt-1">{appointments.length} appointments tracked</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Appointment
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(["all", "scheduled", "confirmed", "no-show", "cancelled", "completed"] as const).map((s) => {
          const count = s === "all" ? appointments.length : statusCounts[s as keyof typeof statusCounts];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                statusFilter === s
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}{" "}
              <span className={`ml-1 text-xs ${statusFilter === s ? "opacity-70" : "text-slate-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Type filter */}
        <div className="flex gap-3 p-4 border-b border-slate-100 bg-slate-50">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
          >
            <option value="all">All Types</option>
            <option value="consultation">Consultation</option>
            <option value="follow-up">Follow-up</option>
            <option value="lab">Lab</option>
            <option value="procedure">Procedure</option>
          </select>
          <div className="flex-1" />
          <span className="text-sm text-slate-400 self-center">{sorted.length} results</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Date & Time</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Reminders</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((appt) => (
                <tr
                  key={appt.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedAppt(appt)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                        {appt.patientName.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="font-medium text-sm text-slate-900">{appt.patientName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{appt.provider}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[appt.type]}`}>
                      {appt.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800">{appt.date}</p>
                    <p className="text-xs text-slate-500">{appt.time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[appt.status]}`}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${i <= appt.remindersSent ? "bg-teal-500" : "bg-slate-200"}`}
                        />
                      ))}
                      <span className="text-xs text-slate-400 ml-1">{appt.remindersSent}/3</span>
                    </div>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button className="text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded transition-colors">
                        Send SMS
                      </button>
                      <button className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No appointments match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">New Appointment</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Patient <span className="text-red-500">*</span></label>
                <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  <option value="">Select a patient...</option>
                  {["Sarah Johnson","Michael Chen","Linda Okafor","Emily Rodriguez"].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Appointment Type <span className="text-red-500">*</span></label>
                <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  <option>Consultation</option>
                  <option>Follow-up</option>
                  <option>Lab</option>
                  <option>Procedure</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Date <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Time <span className="text-red-500">*</span></label>
                  <input type="time" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Provider</label>
                <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  {["Dr. Martinez","Dr. Patel","Dr. Williams"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea rows={2} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" placeholder="Optional notes..." />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">Create Appointment</button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment detail side panel */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-black/20 flex justify-end z-50">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Appointment Details</h2>
              <button onClick={() => setSelectedAppt(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-700">
                  {selectedAppt.patientName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedAppt.patientName}</p>
                  <p className="text-sm text-slate-500">{selectedAppt.provider}</p>
                </div>
              </div>
              <DetailRow label="Date" value={selectedAppt.date} />
              <DetailRow label="Time" value={selectedAppt.time} />
              <DetailRow label="Type" value={selectedAppt.type} />
              <DetailRow
                label="Status"
                value={
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[selectedAppt.status]}`}>
                    {selectedAppt.status}
                  </span>
                }
              />
              <DetailRow label="Reminders Sent" value={`${selectedAppt.remindersSent} / 3`} />
              {selectedAppt.lastReminder && (
                <DetailRow label="Last Reminder" value={selectedAppt.lastReminder} />
              )}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <button className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Reminder Now
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    Confirm
                  </button>
                  <button className="py-2.5 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                    Cancel Appt.
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}
