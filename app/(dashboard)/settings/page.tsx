"use client";

import { useState, useEffect } from "react";
import { Save, Settings } from "lucide-react";

interface SystemSettings {
  reminderHoursBefore: number;
  reminderEnabled: boolean;
  facilityName: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates));
  }, []);

  async function saveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const body = {
      facilityName: formData.get("facilityName") as string,
      reminderHoursBefore: parseInt(formData.get("reminderHoursBefore") as string),
      reminderEnabled: formData.get("reminderEnabled") === "on",
    };

    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setMessage("Settings saved successfully!");
    setSaving(false);
  }

  async function saveTemplate(name: string, content: string) {
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content }),
    });
    setMessage("Template saved!");
  }

  if (!settings) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500">
          Configure system preferences and message templates
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <form
        onSubmit={saveSettings}
        className="space-y-5 rounded-xl bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">
            System Settings
          </h3>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Facility Name
          </label>
          <input
            name="facilityName"
            defaultValue={settings.facilityName}
            className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Send reminder (hours before appointment)
          </label>
          <input
            name="reminderHoursBefore"
            type="number"
            min={1}
            max={168}
            defaultValue={settings.reminderHoursBefore}
            className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            name="reminderEnabled"
            type="checkbox"
            defaultChecked={settings.reminderEnabled}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label className="text-sm font-medium text-slate-700">
            Enable automatic reminders
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>

      <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">
          Message Templates
        </h3>
        <p className="text-xs text-slate-500">
          Variables: {"{patient_name}"}, {"{facility}"}, {"{date}"}, {"{time}"}
        </p>
        {templates.map((t) => (
          <div key={t.id} className="space-y-2 rounded-lg border p-4">
            <p className="text-sm font-medium text-slate-700">{t.name}</p>
            <textarea
              defaultValue={t.content}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              onBlur={(e) => saveTemplate(t.name, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
