import { PageHeader } from "@/components/layout/Header";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="System configuration and preferences" />

      <div className="max-w-2xl space-y-6">
        {/* Facility Info */}
        <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Facility Information</h3>
          <div className="space-y-4">
            {[
              { label: "Facility Name", placeholder: "e.g. Ridge Hospital", defaultValue: "Ridge Hospital" },
              { label: "Facility Phone", placeholder: "e.g. 0302-123456", defaultValue: "" },
              { label: "Facility Address", placeholder: "e.g. Ridge Road, Accra" , defaultValue: "" },
              { label: "SMS Sender ID", placeholder: "e.g. HealthFac (max 11 chars)", defaultValue: "HealthFac" },
            ].map(({ label, placeholder, defaultValue }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  defaultValue={defaultValue}
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* SMS Provider */}
        <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">SMS Provider</h3>
          <p className="mb-4 text-xs text-slate-400">Configure your SMS gateway API credentials</p>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Provider</label>
              <select className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="arkesel">Arkesel</option>
                <option value="hubtel">Hubtel</option>
                <option value="africastalking">Africa&apos;s Talking</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">API Key</label>
              <input
                type="password"
                placeholder="Enter your API key (stored in .env)"
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700 ring-1 ring-amber-200">
            Set <code className="font-mono">ARKESEL_API_KEY</code> and <code className="font-mono">SMS_SENDER_ID</code> in your <code className="font-mono">.env</code> file. Without an API key the system operates in simulation mode.
          </p>
        </div>

        {/* Reminder schedule */}
        <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Reminder Schedule</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Send reminders</label>
              <select className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="24">24 hours before appointment</option>
                <option value="48">48 hours before appointment</option>
                <option value="1">1 hour before appointment</option>
              </select>
            </div>
          </div>
        </div>

        <button className="h-9 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}
