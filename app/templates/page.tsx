"use client";

import { useState } from "react";
import { smsTemplates, SmsTemplate } from "@/lib/data";

const MERGE_FIELDS = ["{{patient_name}}", "{{provider}}", "{{date}}", "{{time}}", "{{location}}"];

function highlightMergeFields(text: string) {
  const parts = text.split(/({{[^}]+}})/g);
  return parts.map((part, i) =>
    part.startsWith("{{") ? (
      <mark key={i} className="bg-teal-100 text-teal-700 rounded px-0.5 font-medium not-italic">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(smsTemplates);
  const [editing, setEditing] = useState<SmsTemplate | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftTiming, setDraftTiming] = useState("");
  const [showNew, setShowNew] = useState(false);

  function openEdit(t: SmsTemplate) {
    setEditing(t);
    setDraftBody(t.body);
    setDraftName(t.name);
    setDraftTiming(t.timing);
    setShowNew(false);
  }

  function openNew() {
    setEditing(null);
    setDraftBody("");
    setDraftName("");
    setDraftTiming("24 hours before");
    setShowNew(true);
  }

  function toggleActive(id: string) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );
  }

  const charCount = draftBody.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SMS Templates</h1>
          <p className="text-slate-500 mt-1">Manage your reminder message templates</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Template
        </button>
      </div>

      {/* Merge field reference */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6 flex items-start gap-3">
        <svg className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-teal-800 mb-2">Available Merge Fields</p>
          <div className="flex flex-wrap gap-2">
            {MERGE_FIELDS.map((f) => (
              <code key={f} className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded text-xs font-mono">
                {f}
              </code>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Template list */}
        <div className="xl:col-span-2 space-y-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl border p-5 transition-all ${
                editing?.id === t.id ? "border-teal-500 shadow-md" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{t.name}</h3>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {t.timing}
                    </span>
                    {!t.active && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleActive(t.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      t.active ? "bg-teal-500" : "bg-slate-200"
                    }`}
                    title={t.active ? "Disable template" : "Enable template"}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        t.active ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="text-xs font-medium text-teal-600 hover:text-teal-700 px-2 py-1 bg-teal-50 rounded transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {highlightMergeFields(t.body)}
              </p>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span>{t.body.length} chars · {Math.ceil(t.body.length / 160)} SMS segment{Math.ceil(t.body.length / 160) > 1 ? "s" : ""}</span>
                <span>{t.sentCount.toLocaleString()} sent total</span>
                {t.lastUsed && <span>Last used {t.lastUsed}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Editor panel */}
        {(editing || showNew) && (
          <div className="xl:sticky xl:top-6 h-fit">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">
                {showNew ? "New Template" : "Edit Template"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Template Name</label>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. 24-Hour Reminder"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Send Timing</label>
                  <select
                    value={draftTiming}
                    onChange={(e) => setDraftTiming(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option>7 days before</option>
                    <option>48 hours before</option>
                    <option>24 hours before</option>
                    <option>2 hours before</option>
                    <option>After appointment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Message Body</label>
                  <textarea
                    rows={6}
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none font-mono"
                    placeholder="Type your message here..."
                  />
                  <div className="flex justify-between mt-1 text-xs text-slate-400">
                    <span>{charCount} characters</span>
                    <span>{smsSegments} SMS segment{smsSegments > 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Preview */}
                {draftBody && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-2">Preview</p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {highlightMergeFields(draftBody)}
                    </p>
                  </div>
                )}

                {/* Merge field inserter */}
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Insert merge field:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MERGE_FIELDS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setDraftBody((prev) => prev + f)}
                        className="text-xs bg-slate-100 hover:bg-teal-100 text-slate-600 hover:text-teal-700 px-2 py-1 rounded font-mono transition-colors"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setEditing(null); setShowNew(false); }}
                    className="flex-1 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setEditing(null); setShowNew(false); }}
                    className="flex-1 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
