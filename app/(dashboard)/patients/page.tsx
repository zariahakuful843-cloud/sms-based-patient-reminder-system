"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate, calculateAge } from "@/lib/utils";
import { useCan } from "@/lib/session-context";

type Patient = {
  id: number;
  fullName: string;
  gender: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  createdAt: string;
  _count: { appointments: number };
};

export default function PatientsPage() {
  const can = useCan();
  const canCreate = can("patients.create");
  const canDelete = can("patients.delete");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, page: String(page), limit: String(limit) });
    const res = await fetch(`/api/patients?${params}`);
    const data = await res.json();
    setPatients(data.patients ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete patient "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/patients/${id}`, { method: "DELETE" });
    fetchPatients();
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageHeader
        title="Patients"
        description={`${total} registered patient${total !== 1 ? "s" : ""}`}
        action={
          canCreate ? (
            <Link href="/patients/new">
              <Button size="sm">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Register Patient
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name or phone number…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-9 w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Patient", "Gender", "Phone", "DOB / Age", "Appointments", "Registered", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                  No patients found.{" "}
                  {canCreate && (
                    <Link href="/patients/new" className="text-blue-600 hover:underline">
                      Register the first one.
                    </Link>
                  )}
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {p.fullName.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900">{p.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <Badge status={p.gender} label={p.gender} />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{p.phoneNumber}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(p.dateOfBirth)}
                    <span className="ml-1 text-xs text-slate-400">({calculateAge(p.dateOfBirth)} yrs)</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p._count.appointments}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/patients/${p.id}`}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        View
                      </Link>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(p.id, p.fullName)}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
