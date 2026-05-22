"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Edit } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  phoneNumber: string;
  gender: string | null;
  dateOfBirth: string | null;
  createdAt: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await fetch(
        `/api/patients?search=${search}&page=${page}&limit=10`
      );
      const data = await res.json();
      if (!cancelled) {
        setPatients(data.patients);
        setTotal(data.total);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [search, page, refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this patient?")) return;
    await fetch(`/api/patients/${id}`, { method: "DELETE" });
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patients</h1>
          <p className="text-sm text-slate-500">
            Manage patient records ({total} total)
          </p>
        </div>
        <Link
          href="/patients/new"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Patient
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search patients by name or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : patients.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No patients found
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm font-medium text-slate-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Gender</th>
                <th className="px-5 py-3">Date of Birth</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/patients/${patient.id}`}
                      className="font-medium text-slate-800 hover:text-emerald-600"
                    >
                      {patient.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {patient.phoneNumber}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {patient.gender || "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {patient.dateOfBirth
                      ? new Date(patient.dateOfBirth).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(patient.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 10 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="flex items-center px-4 text-sm text-slate-600">
            Page {page} of {Math.ceil(total / 10)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 10)}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
