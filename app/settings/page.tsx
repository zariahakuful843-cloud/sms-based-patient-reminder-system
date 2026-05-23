"use client";

import { useState } from "react";

const tabs = ["Clinic Info", "SMS Provider", "Reminder Schedule", "Users", "Audit Log"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Clinic Info");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Configure your CareRemind system</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0">
          <nav className="space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === "Clinic Info" && <ClinicInfoTab onSave={handleSave} />}
          {activeTab === "SMS Provider" && <SmsProviderTab onSave={handleSave} />}
          {activeTab === "Reminder Schedule" && <ReminderScheduleTab onSave={handleSave} />}
          {activeTab === "Users" && <UsersTab />}
          {activeTab === "Audit Log" && <AuditLogTab />}
        </div>
      </div>

      {/* Save toast */}
      {saved && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Settings saved successfully
        </div>
      )}
    </main>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-start py-4 border-b border-slate-100 last:border-0">
      <div className="col-span-1">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

function Input({ defaultValue, placeholder, type = "text" }: { defaultValue?: string; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
    />
  );
}

function ClinicInfoTab({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Clinic Information">
        <Field label="Clinic Name" description="Displayed in SMS messages">
          <Input defaultValue="Riverside Medical Clinic" />
        </Field>
        <Field label="Phone Number" description="Callback number for patients">
          <Input defaultValue="(555) 800-1234" type="tel" />
        </Field>
        <Field label="Address">
          <Input defaultValue="123 Wellness Blvd, Springfield, IL 62701" />
        </Field>
        <Field label="Timezone">
          <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
            <option>America/Chicago (CST/CDT)</option>
            <option>America/New_York (EST/EDT)</option>
            <option>America/Los_Angeles (PST/PDT)</option>
            <option>America/Denver (MST/MDT)</option>
          </select>
        </Field>
        <Field label="Working Hours" description="Reminders will only send during these hours">
          <div className="flex items-center gap-2">
            <input type="time" defaultValue="08:00" className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <span className="text-slate-400 text-sm">to</span>
            <input type="time" defaultValue="18:00" className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        </Field>
      </SectionCard>
      <div className="flex justify-end">
        <button onClick={onSave} className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function SmsProviderTab({ onSave }: { onSave: () => void }) {
  const [provider, setProvider] = useState("twilio");
  return (
    <div className="space-y-6">
      <SectionCard title="SMS Provider">
        <Field label="Provider">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="twilio">Twilio</option>
            <option value="vonage">Vonage (Nexmo)</option>
            <option value="aws">AWS SNS</option>
          </select>
        </Field>
        {provider === "twilio" && (
          <>
            <Field label="Account SID">
              <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
            </Field>
            <Field label="Auth Token">
              <input type="password" placeholder="••••••••••••••••••••••••••••••••" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </Field>
            <Field label="From Number" description="Your Twilio phone number">
              <Input placeholder="+15551234567" />
            </Field>
          </>
        )}
        {provider === "vonage" && (
          <>
            <Field label="API Key"><Input placeholder="Your Vonage API key" /></Field>
            <Field label="API Secret"><input type="password" placeholder="••••••••••••" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" /></Field>
          </>
        )}
        {provider === "aws" && (
          <>
            <Field label="AWS Region"><Input defaultValue="us-east-1" /></Field>
            <Field label="Access Key ID"><Input placeholder="AKIAIOSFODNN7EXAMPLE" /></Field>
            <Field label="Secret Access Key"><input type="password" placeholder="••••••••••••" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500" /></Field>
          </>
        )}
      </SectionCard>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        <strong>Note:</strong> Before launching, ensure you have completed A2P 10DLC registration with your carrier to avoid message filtering. See the <span className="underline cursor-pointer">compliance guide</span>.
      </div>
      <div className="flex justify-end gap-3">
        <button className="border border-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
          Send Test SMS
        </button>
        <button onClick={onSave} className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          Save Provider
        </button>
      </div>
    </div>
  );
}

function ReminderScheduleTab({ onSave }: { onSave: () => void }) {
  const [steps, setSteps] = useState([
    { id: 1, label: "7 days before", enabled: true },
    { id: 2, label: "48 hours before", enabled: true },
    { id: 3, label: "24 hours before", enabled: true },
    { id: 4, label: "2 hours before", enabled: false },
    { id: 5, label: "Post-appointment", enabled: true },
  ]);

  return (
    <div className="space-y-6">
      <SectionCard title="Default Reminder Schedule">
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-slate-800">{step.label}</span>
              <button
                onClick={() => setSteps((prev) => prev.map((s) => s.id === step.id ? { ...s, enabled: !s.enabled } : s))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${step.enabled ? "bg-teal-500" : "bg-slate-200"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${step.enabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Opt-Out Behavior">
        <Field label="STOP Keyword" description="Patients who reply with this will be opted out">
          <Input defaultValue="STOP" />
        </Field>
        <Field label="Opt-out Message" description="Message sent after STOP">
          <textarea rows={2} defaultValue="You've been unsubscribed from appointment reminders. Reply START to re-subscribe." className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
        </Field>
      </SectionCard>
      <div className="flex justify-end">
        <button onClick={onSave} className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          Save Schedule
        </button>
      </div>
    </div>
  );
}

const users = [
  { name: "Maria Rodriguez", email: "maria.r@clinic.com", role: "Staff", status: "active", lastLogin: "Today, 7:05 AM" },
  { name: "Dr. Chen", email: "dr.chen@clinic.com", role: "Admin", status: "active", lastLogin: "Yesterday, 3:14 PM" },
  { name: "James Wilson", email: "james.w@clinic.com", role: "Viewer", status: "active", lastLogin: "May 20, 2026" },
  { name: "Laura Kim", email: "laura.k@clinic.com", role: "Staff", status: "inactive", lastLogin: "Apr 12, 2026" },
];

function UsersTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Invite User
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50">
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Last Login</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.email} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700 shrink-0">
                      {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    u.role === "Admin" ? "bg-purple-100 text-purple-700" :
                    u.role === "Staff" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>{u.role}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{u.lastLogin}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">Edit</button>
                    <span className="text-slate-200">|</span>
                    <button className="text-xs text-red-500 hover:text-red-600 font-medium">Revoke</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const auditLog = [
  { time: "2026-05-23 07:14", user: "Maria R.", action: "Sent reminder to Sarah Johnson (Appt #a1)", type: "sms" },
  { time: "2026-05-23 07:10", user: "System", action: "Scheduled 3 reminders for May 24 appointments", type: "schedule" },
  { time: "2026-05-22 16:45", user: "Dr. Chen", action: "Updated template: 48-Hour Reminder", type: "template" },
  { time: "2026-05-22 14:20", user: "Maria R.", action: "Added patient: Thomas Anderson", type: "patient" },
  { time: "2026-05-22 11:05", user: "System", action: "Delivery report: 47/48 messages delivered", type: "sms" },
  { time: "2026-05-21 09:30", user: "Laura K.", action: "Marked appointment #a4 as no-show", type: "appointment" },
  { time: "2026-05-20 17:00", user: "System", action: "Opt-out processed for James Wilson", type: "opt-out" },
];

const typeIcon: Record<string, string> = {
  sms: "📤", schedule: "⏰", template: "✏️", patient: "👤", appointment: "📅", "opt-out": "🚫",
};

function AuditLogTab() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">System Audit Log</h2>
        <button className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {auditLog.map((entry, i) => (
          <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
            <span className="text-lg mt-0.5" title={entry.type}>{typeIcon[entry.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800">{entry.action}</p>
              <p className="text-xs text-slate-400 mt-0.5">{entry.user} · {entry.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
