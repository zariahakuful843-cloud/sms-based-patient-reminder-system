"use client";

import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/Button";

type ParsedRow = {
  fullName: string;
  gender: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string; // ISO yyyy-mm-dd once validated
  rowNumber: number;
  error?: string;
};

const HEADER_ALIASES: Record<string, string> = {
  "full name": "fullName",
  "fullname": "fullName",
  "gender": "gender",
  "phone number": "phoneNumber",
  "phonenumber": "phoneNumber",
  "phone": "phoneNumber",
  "address": "address",
  "date of birth": "dateOfBirth",
  "dateofbirth": "dateOfBirth",
  "dob": "dateOfBirth",
};

function excelSerialToDate(serial: number): Date {
  // Excel's epoch quirk (1900 leap-year bug) — standard conversion formula.
  return new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
}

function parseDateToISO(raw: string | number): string | null {
  if (raw === null || raw === undefined || raw === "") return null;

  if (typeof raw === "number") {
    const d = excelSerialToDate(raw);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }

  const value = String(raw).trim();

  // DD/MM/YYYY or D/M/YYYY
  const dmy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    const test = new Date(iso);
    if (!isNaN(test.getTime())) return iso;
    return null;
  }

  // YYYY-MM-DD already
  const ymd = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const test = new Date(value);
    if (!isNaN(test.getTime())) return value;
    return null;
  }

  return null;
}

function normalizeHeaderRow(row: string[]): Record<number, string> {
  const map: Record<number, string> = {};
  row.forEach((cell, idx) => {
    const key = String(cell || "").trim().toLowerCase();
    if (HEADER_ALIASES[key]) map[idx] = HEADER_ALIASES[key];
  });
  return map;
}

function rowsToParsedRows(rows: string[][]): ParsedRow[] {
  // Find the header row: the first row containing at least "full name" and "phone".
  let headerIdx = -1;
  let colMap: Record<number, string> = {};
  for (let i = 0; i < rows.length; i++) {
    const map = normalizeHeaderRow(rows[i]);
    const values = Object.values(map);
    if (values.includes("fullName") && values.includes("phoneNumber")) {
      headerIdx = i;
      colMap = map;
      break;
    }
  }
  if (headerIdx === -1) return [];

  const result: ParsedRow[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c || String(c).trim() === "")) continue; // skip blank rows

    const record: any = { fullName: "", gender: "", phoneNumber: "", address: "", dateOfBirth: "" };
    Object.entries(colMap).forEach(([idx, field]) => {
      record[field] = row[Number(idx)] ?? "";
    });

    const rowNumber = i + 1;
    let error: string | undefined;

    const fullName = String(record.fullName || "").trim();
    const gender = String(record.gender || "").trim();
    const phoneNumber = String(record.phoneNumber || "").trim();
    const address = String(record.address || "").trim();
    const dobRaw = record.dateOfBirth;

    if (!fullName || !gender || !phoneNumber || !address || !dobRaw) {
      error = "Missing one or more required fields";
    }

    const isoDate = !error ? parseDateToISO(dobRaw) : null;
    if (!error && !isoDate) {
      error = `Unrecognized date format: "${dobRaw}"`;
    }

    result.push({
      fullName,
      gender,
      phoneNumber,
      address,
      dateOfBirth: isoDate ?? "",
      rowNumber,
      error,
    });
  }
  return result;
}

export default function ImportPatientsModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; failed: { row: number; name: string; reason: string }[] } | null>(null);

  if (!open) return null;

  const validRows = parsedRows.filter((r) => !r.error);
  const invalidRows = parsedRows.filter((r) => r.error);

  const handleFile = async (file: File) => {
    setParsing(true);
    setResult(null);
    setFileName(file.name);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let rows: string[][] = [];

      if (ext === "csv") {
        const text = await file.text();
        const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
        rows = parsed.data as string[][];
      } else {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" }) as string[][];
      }

      setParsedRows(rowsToParsedRows(rows));
    } catch (err) {
      alert("Could not read that file. Please make sure it's a valid CSV or Excel file.");
      setParsedRows([]);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    if (!confirm(`Import ${validRows.length} patient(s)? This will add them to your database.`)) return;
    setImporting(true);
    try {
      const res = await fetch("/api/patients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult({ imported: data.imported, failed: data.failed });
      onImported();
    } catch (err: any) {
      alert(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setParsedRows([]);
    setFileName("");
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Import Patients</h2>
          <button onClick={() => { reset(); onClose(); }} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {!result && (
            <>
              <div className="rounded-lg border-2 border-dashed border-slate-300 p-6 text-center">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="text-sm"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Upload a .csv or .xlsx file using the patient import template.
                </p>
              </div>

              {parsing && <p className="text-sm text-slate-500">Reading file…</p>}

              {parsedRows.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{fileName}</span>
                    <span className="text-slate-500">
                      {validRows.length} valid, {invalidRows.length} with errors
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Row</th>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Gender</th>
                          <th className="px-3 py-2 text-left">Phone</th>
                          <th className="px-3 py-2 text-left">DOB</th>
                          <th className="px-3 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((r) => (
                          <tr key={r.rowNumber} className={r.error ? "bg-red-50" : ""}>
                            <td className="px-3 py-2">{r.rowNumber}</td>
                            <td className="px-3 py-2">{r.fullName || "-"}</td>
                            <td className="px-3 py-2">{r.gender || "-"}</td>
                            <td className="px-3 py-2">{r.phoneNumber || "-"}</td>
                            <td className="px-3 py-2">{r.dateOfBirth || "-"}</td>
                            <td className="px-3 py-2">
                              {r.error ? (
                                <span className="text-red-600">{r.error}</span>
                              ) : (
                                <span className="text-emerald-600">OK</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
                <Button
                  onClick={handleImport}
                  disabled={validRows.length === 0 || importing}
                >
                  {importing ? "Importing…" : `Import ${validRows.length} Patient(s)`}
                </Button>
              </div>
            </>
          )}

          {result && (
            <div className="space-y-3">
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-emerald-700 text-sm">
                Successfully imported {result.imported} patient(s).
              </div>
              {result.failed.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-sm">
                  <p className="font-medium text-red-700 mb-2">{result.failed.length} row(s) failed:</p>
                  <ul className="space-y-1 text-red-600">
                    {result.failed.map((f, i) => (
                      <li key={i}>Row {f.row} ({f.name}): {f.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => { reset(); onClose(); }}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
