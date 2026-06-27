"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";

type SettingsState = {
  facilityName: string;
  facilityPhone: string;
  facilityAddress: string;
  senderId: string;
  smsProvider: string;
  apiKey: string;
  reminderInterval: string;
  enableEmailReminders: boolean;
  enableSMSReminders: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  facilityName: "Ridge Hospital",
  facilityPhone: "+233 302 123 456",
  facilityAddress: "Ridge Road, Accra, Ghana",
  senderId: "HealthFac",
  smsProvider: "arkesel",
  apiKey: "",
  reminderInterval: "24",
  enableEmailReminders: false,
  enableSMSReminders: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<"facility" | "sms" | "reminders">("facility");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Load settings from localStorage on client mount
  useEffect(() => {
    const saved = localStorage.getItem("app_settings");
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call saving settings
    setTimeout(() => {
      localStorage.setItem("app_settings", JSON.stringify(settings));
      setIsSaving(false);
      showToast("Settings saved successfully!", "success");
    }, 1000);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (key: keyof SettingsState, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Settings" description="Configure system parameters, hospital profile, and SMS configurations." />
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ring-1 transition-all ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 ring-green-200"
                : "bg-red-50 text-red-800 ring-red-200"
            }`}
          >
            {toast.type === "success" ? (
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {toast.message}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side navigation tabs */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto rounded-xl bg-white p-2 ring-1 ring-slate-200 shadow-sm">
            {[
              { id: "facility", label: "Facility Profile", icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )},
              { id: "sms", label: "SMS Integration", icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )},
              { id: "reminders", label: "Reminder Rules", icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )},
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap lg:w-full ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Right side form panels */}
        <div className="flex-1 space-y-6">
          {activeTab === "facility" && (
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Facility Profile</h3>
                <p className="text-xs text-slate-400">Configure information about your hospital or clinic.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Facility Name</label>
                  <input
                    type="text"
                    value={settings.facilityName}
                    onChange={(e) => handleChange("facilityName", e.target.value)}
                    placeholder="e.g. Ridge Hospital"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Facility Phone</label>
                  <input
                    type="text"
                    value={settings.facilityPhone}
                    onChange={(e) => handleChange("facilityPhone", e.target.value)}
                    placeholder="e.g. +233 302 123 456"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Facility Address</label>
                  <input
                    type="text"
                    value={settings.facilityAddress}
                    onChange={(e) => handleChange("facilityAddress", e.target.value)}
                    placeholder="e.g. Ridge Road, Accra, Ghana"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">SMS Sender ID</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={settings.senderId}
                    onChange={(e) => handleChange("senderId", e.target.value)}
                    placeholder="e.g. HealthFac"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                  />
                  <p className="text-[11px] text-slate-400">Maximum of 11 characters. Appears as the sender of SMS messages.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sms" && (
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">SMS Gateway Integration</h3>
                <p className="text-xs text-slate-400">Configure your SMS API provider and authentication key.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">SMS Provider</label>
                  <select
                    value={settings.smsProvider}
                    onChange={(e) => handleChange("smsProvider", e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="arkesel">Arkesel (Ghana)</option>
                    <option value="hubtel">Hubtel</option>
                    <option value="africastalking">Africa&apos;s Talking</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={settings.apiKey}
                      onChange={(e) => handleChange("apiKey", e.target.value)}
                      placeholder={process.env.NEXT_PUBLIC_ARKESEL_API_KEY ? "••••••••••••••••" : "Enter API Key"}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKey ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200 flex items-start gap-3">
                  <svg className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Standard configurations like <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-bold">ARKESEL_API_KEY</code> are loaded from the environment file (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-bold">.env</code>). Entering an API key here overrides local settings for this browser session.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reminders" && (
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reminder Schedule Rules</h3>
                <p className="text-xs text-slate-400">Configure scheduling offsets and preferred notification channels.</p>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Send reminders</label>
                  <select
                    value={settings.reminderInterval}
                    onChange={(e) => handleChange("reminderInterval", e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="24">24 hours before appointment</option>
                    <option value="48">48 hours before appointment</option>
                    <option value="12">12 hours before appointment</option>
                    <option value="2">2 hours before appointment</option>
                  </select>
                </div>

                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900">Notification Channels</h4>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">SMS Reminders</p>
                      <p className="text-xs text-slate-400">Dispatch text reminders directly to patients&apos; phone numbers.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange("enableSMSReminders", !settings.enableSMSReminders)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.enableSMSReminders ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.enableSMSReminders ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Email Reminders</p>
                      <p className="text-xs text-slate-400">Send an automated summary reminder to the patient&apos;s registered email.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChange("enableEmailReminders", !settings.enableEmailReminders)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.enableEmailReminders ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.enableEmailReminders ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              loading={isSaving}
              type="button"
              onClick={handleSave}
              className="h-10 px-6 font-semibold"
            >
              Save Settings
            </Button>
            <button
              type="button"
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              className="h-10 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
