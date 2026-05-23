"use client";

import { useState } from "react";
import { patients, Patient } from "@/lib/data";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  "opted-out": "bg-red-100 text-red-700",
};

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);

  const providers = Array.from(new Set(patients.map((p) => p.provider)));

  const filtered = patients.filter((p) => {
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchProvider = providerFilter === "all" || p.provider === providerFilter;
    return matchSearch && matchStatus && matchProvider;
  });

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500 mt-1">{patients.length} total patients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Patient
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <QuickStat label="Active" value={patients.filter((p) => p.status === "active").length} color="text-emerald-600" />
        <QuickStat label="Inactive" value={patients.filter((p) => p.status === "inactive").length} color="text-slate-500" />
        <QuickStat label="Opted Out" value={patients.filter((p) => p.status === "opted-out").length} color="text-red-600" />
        <QuickStat label="Chronic No-Shows" value={patients.filter((p) => p.noShowCount >= 3).length} color="text-amber-600" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex flex-wrap gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="opted-out">Opted Out</option>
          </select>
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700"
          >
            <option value="all">All Providers</option>
            {providers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">No-Shows</th>
                <th className="px-6 py-3">Added</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((patient) => (
                <PatientRow key={patient.id} patient={patient} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No patients match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Add New Patient</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <FormField label="Full Name" placeholder="e.g. Jane Smith" required />
              <FormField label="Phone Number" placeholder="+1 (555) 000-0000" type="tel" required />
              <FormField label="Email Address" placeholder="jane@email.com" type="email" />
              <FormField label="Date of Birth" placeholder="" type="date" required />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Provider</label>
                <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-slate-700">
                  {providers.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                Add Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function PatientRow({ patient }: { patient: Patient }) {
  const isChronicNoShow = patient.noShowCount >= 3;
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
            {patient.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <p className="font-medium text-slate-900 text-sm">{patient.name}</p>
            {patient.email && <p className="text-xs text-slate-400">{patient.email}</p>}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{patient.phone}</td>
      <td className="px-6 py-4 text-sm text-slate-600">{patient.provider}</td>
      <td className="px-6 py-4">
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[patient.status]}`}>
          {patient.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-semibold ${isChronicNoShow ? "text-red-600" : "text-slate-700"}`}>
            {patient.noShowCount}
          </span>
          {isChronicNoShow && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">high risk</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">{patient.createdAt}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors">Edit</button>
          <span className="text-slate-200">|</span>
          <button className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors">View</button>
        </div>
      </td>
    </tr>
  );
}

function QuickStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function FormField({
  label,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-300"
      />
    </div>
  );
}
