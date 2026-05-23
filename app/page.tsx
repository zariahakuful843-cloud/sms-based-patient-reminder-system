import type { ReactNode } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const phases = [
  {
    number: 1,
    title: "Project Setup",
    color: "blue",
    status: "ready",
    duration: "Week 1",
    description:
      "Bootstrap the Next.js application, configure the development toolchain, and establish project conventions.",
    tasks: [
      "Initialise Next.js 14 project with TypeScript",
      "Configure Tailwind CSS",
      "Set up ESLint & Prettier",
      "Create GitHub repository and branch strategy",
      "Configure environment variables",
      "Set up Neon PostgreSQL instance",
      "Initialise Prisma ORM and connect database",
      "Define folder structure (app router, API routes, lib)",
    ],
    deliverables: ["Running dev server", "Database connection", "CI/CD pipeline"],
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Prisma", "Neon PostgreSQL"],
  },
  {
    number: 2,
    title: "Database Design",
    color: "indigo",
    status: "ready",
    duration: "Week 1–2",
    description:
      "Model all database entities, write Prisma migrations, and seed initial reference data.",
    tasks: [
      "Design Users table (id, username, password, role, createdAt)",
      "Design Patients table (id, fullName, gender, phoneNumber, address, dateOfBirth)",
      "Design Appointments table (id, patientId, doctorName, appointmentDate, status, reminderSent)",
      "Design SMSLogs table (id, patientId, message, deliveryStatus, sentAt)",
      "Define foreign-key relationships and indexes",
      "Write Prisma schema and run initial migration",
      "Create database seed script with sample data",
      "Document ERD (Entity-Relationship Diagram)",
    ],
    deliverables: ["Prisma schema", "Database migrations", "ERD document", "Seed script"],
    tech: ["Prisma", "PostgreSQL", "Neon"],
  },
  {
    number: 3,
    title: "Authentication Module",
    color: "violet",
    status: "ready",
    duration: "Week 2–3",
    description:
      "Implement secure login, JWT session management, role-based access control, and the login UI.",
    tasks: [
      "Hash passwords with bcrypt on registration",
      "POST /api/auth/login – validate credentials and issue JWT",
      "POST /api/auth/register – create new staff accounts (admin only)",
      "Middleware to protect API routes by role",
      "Build login page UI (email + password form)",
      "Store JWT securely in HTTP-only cookie",
      "Implement logout (clear session cookie)",
      "Role guard components for frontend routes (Admin, Receptionist, Doctor/Nurse)",
    ],
    deliverables: ["Login page", "Auth API endpoints", "Role-based middleware", "JWT session"],
    tech: ["JWT", "bcrypt", "Next.js Middleware", "TypeScript"],
  },
  {
    number: 4,
    title: "Patient Management Module",
    color: "teal",
    status: "ready",
    duration: "Week 3–4",
    description:
      "Build the complete patient CRUD interface with search, filter, and history tracking.",
    tasks: [
      "GET /api/patients – list all patients with pagination and search",
      "POST /api/patients – register a new patient",
      "PUT /api/patients/[id] – update patient record",
      "DELETE /api/patients/[id] – soft-delete patient",
      "Patient list page with search bar and filter controls",
      "Patient registration form (Full Name, Gender, Phone, Address, DOB)",
      "Patient detail/edit view",
      "Input validation (Zod schemas)",
      "Phone number format validation for Ghana (+233)",
    ],
    deliverables: [
      "Patient list page",
      "Registration form",
      "CRUD API endpoints",
      "Search & filter",
    ],
    tech: ["Next.js", "Prisma", "Zod", "TypeScript"],
  },
  {
    number: 5,
    title: "Appointment Module",
    color: "amber",
    status: "ready",
    duration: "Week 4–5",
    description:
      "Enable receptionists to create, update, and cancel appointments while doctors can view their schedules.",
    tasks: [
      "GET /api/appointments – fetch appointments with filters (date, status, doctor)",
      "POST /api/appointments – create appointment linked to patient",
      "PUT /api/appointments/[id] – update appointment (reschedule, assign doctor)",
      "DELETE /api/appointments/[id] – cancel appointment",
      "Appointment scheduling form (patient selector, date/time picker, doctor name)",
      "Appointment list/calendar view",
      "Status management: Scheduled → Completed / Cancelled / Missed",
      "Doctor view – read-only appointment schedule",
      "Flag appointments where reminderSent = false for scheduler pickup",
    ],
    deliverables: [
      "Appointment CRUD API",
      "Scheduling form",
      "Calendar/list view",
      "Doctor schedule view",
    ],
    tech: ["Next.js", "Prisma", "TypeScript", "Date-fns"],
  },
  {
    number: 6,
    title: "SMS Integration Module",
    color: "rose",
    status: "ready",
    duration: "Week 5–6",
    description:
      "Integrate with Arkesel or Hubtel to send automated and on-demand SMS reminders, and log delivery results.",
    tasks: [
      "Integrate Arkesel / Hubtel SMS API",
      "POST /api/sms/send – send a single SMS and log result",
      "Build SMS scheduler (cron job via Vercel Cron or node-cron)",
      "Scheduler queries appointments 24 h before date, sends reminder, sets reminderSent = true",
      "Support bulk SMS (mass notifications)",
      "Reminder types: Appointment, Medication, Vaccination, Antenatal",
      "Dynamic message templating (patient name, date, time, facility)",
      "Log every attempt in SMSLogs table (deliveryStatus, sentAt)",
      "Handle failed SMS – retry logic and error logging",
      "Admin UI to view SMS log and resend failed messages",
    ],
    deliverables: [
      "SMS API integration",
      "Automated scheduler",
      "Bulk SMS support",
      "SMS logs page",
    ],
    tech: ["Arkesel API", "Hubtel API", "Vercel Cron", "Prisma", "TypeScript"],
  },
  {
    number: 7,
    title: "Reporting Module",
    color: "emerald",
    status: "ready",
    duration: "Week 6–7",
    description:
      "Provide administrators with actionable reports and analytics on patients, appointments, and SMS delivery.",
    tasks: [
      "Patient report – total registered, by gender, by month",
      "Appointment report – scheduled vs completed vs missed, by doctor",
      "Missed appointment report – list of no-shows with patient contact",
      "SMS delivery report – sent, delivered, failed counts and rate",
      "Summary dashboard with key KPIs (cards and simple charts)",
      "Date-range filter for all reports",
      "Export reports to CSV / PDF",
      "Role-based report access (Admin only)",
    ],
    deliverables: [
      "Dashboard with KPI cards",
      "4 report types",
      "Date-range filters",
      "CSV/PDF export",
    ],
    tech: ["Next.js", "Recharts / Chart.js", "Prisma", "TypeScript"],
  },
  {
    number: 8,
    title: "Testing & Deployment",
    color: "slate",
    status: "ready",
    duration: "Week 7–8",
    description:
      "Perform thorough QA, fix discovered issues, and deploy the production system to Vercel.",
    tasks: [
      "Unit tests for API route handlers (Jest / Vitest)",
      "Integration tests for database operations",
      "End-to-end tests for critical flows (Playwright)",
      "Security audit – JWT validation, input sanitisation, HTTPS",
      "Performance testing – SMS batch throughput",
      "UAT with facility receptionist and admin users",
      "Fix all high-priority bugs from UAT",
      "Configure production environment variables on Vercel",
      "Set up Neon production database and run migrations",
      "Deploy to Vercel; configure custom domain",
      "Configure Vercel Cron for SMS scheduler",
      "Post-launch monitoring and error alerts",
    ],
    deliverables: [
      "Test suite",
      "Security audit report",
      "UAT sign-off",
      "Production deployment",
    ],
    tech: ["Jest", "Playwright", "Vercel", "Neon PostgreSQL"],
  },
];

const techStack = [
  { category: "Frontend", items: ["Next.js 14", "TypeScript", "Tailwind CSS"] },
  { category: "Backend", items: ["Next.js API Routes", "Prisma ORM", "Zod"] },
  { category: "Database", items: ["PostgreSQL", "Neon (hosted)", "Prisma Migrations"] },
  { category: "Auth", items: ["JWT", "bcrypt", "HTTP-only Cookies"] },
  { category: "SMS", items: ["Arkesel", "Hubtel", "Africa's Talking"] },
  { category: "DevOps", items: ["Vercel", "Vercel Cron", "GitHub Actions"] },
];

const futureEnhancements = [
  { icon: "📱", label: "Mobile Application" },
  { icon: "💬", label: "WhatsApp Reminders" },
  { icon: "📞", label: "Voice Call Reminders" },
  { icon: "🌐", label: "Online Appointment Booking" },
  { icon: "🗂️", label: "Electronic Medical Records" },
  { icon: "🤖", label: "AI Scheduling Assistant" },
];

// ─── Colour helpers ───────────────────────────────────────────────────────────

type Color =
  | "blue"
  | "indigo"
  | "violet"
  | "teal"
  | "amber"
  | "rose"
  | "emerald"
  | "slate";

const colorMap: Record<
  Color,
  { badge: string; ring: string; dot: string; bar: string; tag: string; num: string }
> = {
  blue: {
    badge: "bg-blue-100 text-blue-700",
    ring: "ring-blue-200",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    tag: "bg-blue-50 text-blue-600 border-blue-200",
    num: "bg-blue-500",
  },
  indigo: {
    badge: "bg-indigo-100 text-indigo-700",
    ring: "ring-indigo-200",
    dot: "bg-indigo-500",
    bar: "bg-indigo-500",
    tag: "bg-indigo-50 text-indigo-600 border-indigo-200",
    num: "bg-indigo-500",
  },
  violet: {
    badge: "bg-violet-100 text-violet-700",
    ring: "ring-violet-200",
    dot: "bg-violet-500",
    bar: "bg-violet-500",
    tag: "bg-violet-50 text-violet-600 border-violet-200",
    num: "bg-violet-500",
  },
  teal: {
    badge: "bg-teal-100 text-teal-700",
    ring: "ring-teal-200",
    dot: "bg-teal-500",
    bar: "bg-teal-500",
    tag: "bg-teal-50 text-teal-600 border-teal-200",
    num: "bg-teal-500",
  },
  amber: {
    badge: "bg-amber-100 text-amber-700",
    ring: "ring-amber-200",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    tag: "bg-amber-50 text-amber-600 border-amber-200",
    num: "bg-amber-500",
  },
  rose: {
    badge: "bg-rose-100 text-rose-700",
    ring: "ring-rose-200",
    dot: "bg-rose-500",
    bar: "bg-rose-500",
    tag: "bg-rose-50 text-rose-600 border-rose-200",
    num: "bg-rose-500",
  },
  emerald: {
    badge: "bg-emerald-100 text-emerald-700",
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    tag: "bg-emerald-50 text-emerald-600 border-emerald-200",
    num: "bg-emerald-500",
  },
  slate: {
    badge: "bg-slate-100 text-slate-700",
    ring: "ring-slate-200",
    dot: "bg-slate-500",
    bar: "bg-slate-500",
    tag: "bg-slate-50 text-slate-600 border-slate-200",
    num: "bg-slate-500",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white ring-1 ring-slate-200 p-5 shadow-sm">
      <span className="text-3xl font-bold text-slate-900">{value}</span>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="text-xs text-slate-400">{sub}</span>
    </div>
  );
}

function TechTag({ label, color }: { label: string; color: Color }) {
  const c = colorMap[color];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.tag}`}
    >
      {label}
    </span>
  );
}

function PhaseCard({
  phase,
  isLast,
}: {
  phase: (typeof phases)[number];
  isLast: boolean;
}) {
  const c = colorMap[phase.color as Color];
  return (
    <div className="relative flex gap-6">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ${c.num}`}
        >
          {phase.number}
        </div>
        {!isLast && (
          <div className="mt-1 w-0.5 flex-1 bg-slate-200" />
        )}
      </div>

      {/* Card */}
      <div
        className={`mb-10 flex-1 overflow-hidden rounded-2xl bg-white ring-1 shadow-sm ${c.ring}`}
      >
        {/* Header bar */}
        <div className={`h-1.5 w-full ${c.bar}`} />

        <div className="p-6">
          {/* Title row */}
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Phase {phase.number} — {phase.title}
              </h3>
              <span className="text-xs text-slate-400">{phase.duration}</span>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${c.badge}`}
            >
              Ready to build
            </span>
          </div>

          <p className="mb-5 text-sm leading-relaxed text-slate-600">
            {phase.description}
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Tasks */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tasks
              </h4>
              <ul className="space-y-1.5">
                {phase.tasks.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Deliverables + Tech */}
            <div className="flex flex-col gap-5">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Deliverables
                </h4>
                <ul className="space-y-1.5">
                  {phase.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1 text-emerald-500">✓</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Technologies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {phase.tech.map((t) => (
                    <TechTag key={t} label={t} color={phase.color as Color} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-8 text-2xl font-bold text-slate-900">{children}</h2>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ── Hero ── */}
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-6 py-14">
          {/* Breadcrumb-style tag */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-600 ring-1 ring-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Healthcare · mHealth · Ghana
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            SMS-Based Patient Reminder System
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-500">
            A web-based healthcare management solution for hospitals, clinics, and community
            health centers in Ghana — automating appointment reminders via SMS to reduce
            missed appointments and improve patient outcomes.
          </p>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Development Phases" value="8" sub="Project setup → Deployment" />
            <StatCard label="Core Modules" value="5" sub="Auth, Patients, Appts, SMS, Reports" />
            <StatCard label="Timeline" value="8 wks" sub="Agile sprints" />
            <StatCard label="Target Users" value="4" sub="Admin, Receptionist, Doctor, Patient" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14 space-y-16">

        {/* ── Workflow ── */}
        <section>
          <SectionHeading>Appointment Reminder Workflow</SectionHeading>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
            {[
              "Receptionist creates appointment",
              "Saved to database",
              "Scheduler checks appointments",
              "SMS reminder generated",
              "SMS API sends message",
              "Delivery logged",
            ].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 ring-1 ring-slate-200">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{step}</span>
                </div>
                {i < arr.length - 1 && (
                  <span className="text-slate-300 text-lg">→</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Tech Stack ── */}
        <section>
          <SectionHeading>Technology Stack</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((layer) => (
              <div
                key={layer.category}
                className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm"
              >
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {layer.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {layer.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Phase Roadmap ── */}
        <section>
          <SectionHeading>Development Roadmap</SectionHeading>

          {/* Legend */}
          <div className="mb-8 flex flex-wrap gap-3">
            {phases.map((p) => {
              const c = colorMap[p.color as Color];
              return (
                <div key={p.number} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                  Phase {p.number}: {p.title}
                </div>
              );
            })}
          </div>

          {/* Phase cards */}
          <div>
            {phases.map((phase, index) => (
              <PhaseCard
                key={phase.number}
                phase={phase}
                isLast={index === phases.length - 1}
              />
            ))}
          </div>
        </section>

        {/* ── Database Design ── */}
        <section>
          <SectionHeading>Database Schema Overview</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                table: "Users",
                color: "violet" as Color,
                fields: ["id (PK)", "username", "password (hashed)", "role", "createdAt"],
              },
              {
                table: "Patients",
                color: "teal" as Color,
                fields: ["id (PK)", "fullName", "gender", "phoneNumber", "address", "dateOfBirth"],
              },
              {
                table: "Appointments",
                color: "amber" as Color,
                fields: [
                  "id (PK)",
                  "patientId (FK → Patients)",
                  "doctorName",
                  "appointmentDate",
                  "status",
                  "reminderSent",
                ],
              },
              {
                table: "SMSLogs",
                color: "rose" as Color,
                fields: [
                  "id (PK)",
                  "patientId (FK → Patients)",
                  "message",
                  "deliveryStatus",
                  "sentAt",
                ],
              },
            ].map(({ table, color, fields }) => {
              const c = colorMap[color];
              return (
                <div
                  key={table}
                  className={`overflow-hidden rounded-2xl bg-white ring-1 shadow-sm ${c.ring}`}
                >
                  <div className={`h-1 ${c.bar}`} />
                  <div className="p-5">
                    <h3 className="mb-3 font-bold text-slate-900">{table}</h3>
                    <ul className="space-y-1">
                      {fields.map((f) => (
                        <li
                          key={f}
                          className="rounded-lg bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-700"
                        >
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── API Reference ── */}
        <section>
          <SectionHeading>API Reference</SectionHeading>
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Endpoint", "Method", "Description", "Auth"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { endpoint: "/api/auth/login", method: "POST", desc: "Login and receive JWT", auth: "Public" },
                  { endpoint: "/api/auth/register", method: "POST", desc: "Create staff account", auth: "Admin" },
                  { endpoint: "/api/patients", method: "GET", desc: "List all patients (paginated)", auth: "Staff" },
                  { endpoint: "/api/patients", method: "POST", desc: "Register new patient", auth: "Receptionist" },
                  { endpoint: "/api/patients/[id]", method: "PUT", desc: "Update patient record", auth: "Receptionist" },
                  { endpoint: "/api/patients/[id]", method: "DELETE", desc: "Remove patient record", auth: "Admin" },
                  { endpoint: "/api/appointments", method: "GET", desc: "Fetch appointments with filters", auth: "Staff" },
                  { endpoint: "/api/appointments", method: "POST", desc: "Create new appointment", auth: "Receptionist" },
                  { endpoint: "/api/appointments/[id]", method: "PUT", desc: "Update / reschedule appointment", auth: "Receptionist" },
                  { endpoint: "/api/sms/send", method: "POST", desc: "Send SMS to patient", auth: "Staff" },
                  { endpoint: "/api/reports/patients", method: "GET", desc: "Patient analytics report", auth: "Admin" },
                  { endpoint: "/api/reports/appointments", method: "GET", desc: "Appointment analytics report", auth: "Admin" },
                  { endpoint: "/api/reports/sms", method: "GET", desc: "SMS delivery report", auth: "Admin" },
                ].map((row) => (
                  <tr key={`${row.method}-${row.endpoint}`} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs text-slate-700">{row.endpoint}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                          row.method === "GET"
                            ? "bg-blue-100 text-blue-700"
                            : row.method === "POST"
                            ? "bg-emerald-100 text-emerald-700"
                            : row.method === "PUT"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {row.method}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{row.desc}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.auth === "Public"
                            ? "bg-slate-100 text-slate-600"
                            : row.auth === "Admin"
                            ? "bg-violet-100 text-violet-700"
                            : row.auth === "Receptionist"
                            ? "bg-teal-100 text-teal-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {row.auth}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Future Enhancements ── */}
        <section>
          <SectionHeading>Future Enhancements (v2+)</SectionHeading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {futureEnhancements.map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-200 shadow-sm"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── SMS Example ── */}
        <section>
          <SectionHeading>Example SMS Reminder</SectionHeading>
          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Outbound SMS · Arkesel API
              </span>
            </div>
            <div className="rounded-xl bg-slate-900 px-5 py-4 font-mono text-sm leading-relaxed text-emerald-400">
              Dear Kwame, this is a reminder of your appointment at Ridge Hospital on{" "}
              <span className="text-white">24 May 2026</span> at{" "}
              <span className="text-white">10:00 AM</span>. Please arrive 15 minutes
              early. To reschedule, call <span className="text-white">0302-123456</span>.
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900">SMS Patient Reminder System</p>
            <p className="text-xs text-slate-400">Healthcare · Ghana · Agile Development</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {["Next.js", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL", "Vercel"].map(
              (t) => (
                <span
                  key={t}
                  className="rounded-full bg-slate-100 px-3 py-1 font-medium"
                >
                  {t}
                </span>
              )
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
