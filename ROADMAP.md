# Development Roadmap

## SMS-Based Patient Reminder System for Health Facilities in Ghana

This roadmap breaks the PRD into incremental, shippable phases. Each phase builds on the previous and produces a testable deliverable.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 | Already scaffolded; SSR + API routes in one project |
| Backend | Next.js API Routes / Server Actions | Eliminates separate backend service |
| Database | PostgreSQL + Prisma ORM | Relational data model, type-safe queries |
| SMS API | Hubtel SMS API (primary), Africa's Talking (fallback) | Ghana-focused, local sender IDs |
| Auth | NextAuth.js (Auth.js v5) | Session-based staff authentication |
| Scheduling | node-cron or BullMQ | Automated reminder job processing |
| Deployment | Vercel or self-hosted (Docker) | Flexible for facility constraints |

---

## Phase 1 — Foundation & Authentication

**Goal:** Staff can log in and see a dashboard.

### Tasks

- [ ] Set up PostgreSQL database (local dev via Docker)
- [ ] Install and configure Prisma ORM with initial schema
- [ ] Create `User` model (id, name, email, password_hash, role)
- [ ] Implement NextAuth.js with credentials provider
- [ ] Build Login page UI
- [ ] Build Dashboard layout (sidebar nav, header with user info)
- [ ] Add route protection middleware (redirect unauthenticated users)
- [ ] Seed script for default admin user

### Deliverable

Staff can log in and view an empty dashboard with navigation to all future modules.

---

## Phase 2 — Patient Management

**Goal:** Staff can register, view, edit, and delete patients.

### Tasks

- [ ] Create `Patient` model (id, name, phone_number, date_of_birth, gender, notes, created_at)
- [ ] Build Patient Registration form with validation (phone format: Ghana +233)
- [ ] Build Patient List page with search and pagination
- [ ] Build Patient Detail/Edit page
- [ ] Implement delete with confirmation
- [ ] Add API routes: `POST /api/patients`, `GET /api/patients`, `PATCH /api/patients/[id]`, `DELETE /api/patients/[id]`
- [ ] Input validation (zod schemas)
- [ ] Phone number normalization utility (local → international format)

### Deliverable

Full CRUD for patient records with Ghana phone number validation.

---

## Phase 3 — Appointment Scheduling

**Goal:** Staff can schedule, update, and cancel appointments linked to patients.

### Tasks

- [ ] Create `Appointment` model (id, patient_id FK, appointment_date, appointment_time, type, notes, status [scheduled/completed/cancelled])
- [ ] Build Appointment Creation form (patient selector + date/time picker)
- [ ] Build Appointment List page (filterable by date, patient, status)
- [ ] Build Calendar view (optional, day/week view)
- [ ] Implement appointment update and cancellation
- [ ] API routes: `POST /api/appointments`, `GET /api/appointments`, `PATCH /api/appointments/[id]`
- [ ] Dashboard widget: upcoming appointments today/this week

### Deliverable

Staff can schedule appointments for patients and view them in a list or calendar.

---

## Phase 4 — SMS Integration & Message Sending

**Goal:** System can send SMS messages to patients via Hubtel API.

### Tasks

- [ ] Create `Message` model (id, patient_id FK, appointment_id FK nullable, content, sent_at, status [pending/sent/delivered/failed], provider_ref)
- [ ] Integrate Hubtel SMS API (send endpoint, delivery reports webhook)
- [ ] Build SMS service module with retry logic
- [ ] Create message template system (customizable templates with variables: `{patient_name}`, `{date}`, `{time}`, `{facility}`)
- [ ] Build Message Templates management page
- [ ] Build manual "Send SMS" form (for ad-hoc messages)
- [ ] Build Message Logs page with delivery status tracking
- [ ] Handle API errors gracefully (insufficient balance, invalid number, network timeout)

### Deliverable

Staff can send SMS messages manually; system logs all messages with delivery status.

---

## Phase 5 — Automated Reminder Engine

**Goal:** System automatically sends SMS reminders before appointments.

### Tasks

- [ ] Create `Reminder` model (id, appointment_id FK, scheduled_for, sent_at, status [pending/sent/failed/cancelled])
- [ ] Build reminder scheduling logic (auto-create reminder when appointment is created)
- [ ] Configurable reminder timing (e.g., 24h before, 2h before) — stored in system settings
- [ ] Implement cron job / background worker to process pending reminders
- [ ] Build Reminder Settings page (default timing, enable/disable)
- [ ] Auto-cancel reminders when appointments are cancelled
- [ ] Dashboard widget: reminders sent today, failed reminders
- [ ] Bulk reminder processing (batch SMS sends)

### Deliverable

Reminders are sent automatically before appointments with no staff intervention required.

---

## Phase 6 — Dashboard & Reporting

**Goal:** Staff can monitor system performance and SMS delivery metrics.

### Tasks

- [ ] Dashboard KPI cards: total patients, appointments today, SMS sent this month, delivery rate
- [ ] SMS delivery report charts (sent vs failed over time)
- [ ] Appointment attendance tracking (mark attended/no-show)
- [ ] No-show rate reporting
- [ ] Export reports (CSV)
- [ ] Activity log (who did what, when)

### Deliverable

Comprehensive dashboard with actionable metrics matching PRD success criteria.

---

## Phase 7 — Polish & Production Readiness

**Goal:** System is secure, performant, and ready for deployment.

### Tasks

- [ ] Role-based access control (admin vs staff permissions)
- [ ] Rate limiting on API routes
- [ ] Input sanitization and SQL injection prevention (Prisma handles most)
- [ ] Error boundary and user-friendly error pages
- [ ] Loading states and optimistic UI updates
- [ ] Responsive design (tablet-friendly for clinic environments)
- [ ] Environment variable configuration documentation
- [ ] Docker Compose setup for self-hosted deployment
- [ ] Database backup strategy documentation
- [ ] User guide / help documentation

### Deliverable

Production-ready application deployable to facility infrastructure.

---

## Future Phases (Post-MVP)

| Feature | Description |
|---------|-------------|
| Two-way SMS | Patients reply to confirm/cancel appointments |
| Multi-language | Support Twi, Ga, Ewe message templates |
| Mobile app | Patient-facing app for viewing appointments |
| Hospital integration | HL7/FHIR interoperability |
| SMS cost tracking | Budget monitoring per facility |

---

## Dependency Graph

```
Phase 1 (Auth + Dashboard)
    ↓
Phase 2 (Patients)
    ↓
Phase 3 (Appointments)
    ↓
Phase 4 (SMS Integration) ←── requires SMS API credentials
    ↓
Phase 5 (Automated Reminders)
    ↓
Phase 6 (Reporting)
    ↓
Phase 7 (Production Polish)
```

Phases 1–3 can be developed without any external API credentials. Phase 4 onward requires a Hubtel or Africa's Talking account.

---

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sms_reminder

# Auth
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=http://localhost:3000

# SMS Provider (Hubtel)
HUBTEL_CLIENT_ID=<hubtel-client-id>
HUBTEL_CLIENT_SECRET=<hubtel-client-secret>
HUBTEL_SENDER_ID=<registered-sender-id>

# SMS Provider (Africa's Talking - fallback)
AT_API_KEY=<africastalking-api-key>
AT_USERNAME=<africastalking-username>
AT_SENDER_ID=<registered-sender-id>
```

---

## Getting Started (Next Steps)

1. **Start Phase 1** — Set up PostgreSQL (Docker), install Prisma, build auth flow
2. **Install dependencies:** `npm install prisma @prisma/client next-auth bcryptjs zod`
3. **Initialize Prisma:** `npx prisma init`
4. **Create the database schema** following the models outlined above
5. **Build the login UI** and dashboard shell
