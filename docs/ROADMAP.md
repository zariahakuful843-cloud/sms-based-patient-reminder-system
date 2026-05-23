# Product Roadmap
## SMS-Based Patient Reminder System

**Last Updated:** May 2026  
**Cadence:** 4-week sprints | Quarterly planning

---

## Vision

Build the most trusted, easy-to-deploy SMS reminder platform for small-to-mid-size healthcare practices — helping them eliminate no-shows, reduce administrative burden, and improve patient experience through reliable, automated communication.

---

## Roadmap Overview

```
Q2 2026  ──────────  Phase 1: MVP
Q3 2026  ──────────  Phase 2: Advanced Features
Q4 2026  ──────────  Phase 3: Integrations & Scale
Q1 2027  ──────────  Phase 4: Intelligence & Expansion
```

---

## Phase 1 — MVP (Q2 2026)
**Theme: Core Functionality**  
**Goal:** Deliver a working system that staff can use daily to manage patients, schedule appointments, and send SMS reminders.

### Milestone 1.1 — Foundation (Sprint 1–2)
- [x] Project scaffolding (Next.js, TypeScript, Tailwind CSS)
- [x] Application layout and navigation
- [x] Dashboard UI with key metrics
- [x] Design system (color tokens, typography, component patterns)
- [ ] Authentication — NextAuth.js with email/password + Google OAuth
- [ ] Role-based access control (Admin, Staff, Viewer)

### Milestone 1.2 — Patient Management (Sprint 3–4)
- [x] Patient list with search, filter, and sort
- [x] Create / edit patient profile form
- [ ] Soft-delete (deactivate) patients
- [ ] Patient detail view with reminder history
- [ ] Chronic no-show flag (auto-detection logic)
- [ ] CSV import for bulk patient upload

### Milestone 1.3 — Appointment Management (Sprint 5–6)
- [x] Appointment list with status indicators
- [x] Create / reschedule / cancel appointments
- [ ] Calendar view (daily and weekly)
- [ ] Appointment type support (consultation, follow-up, lab, procedure)
- [ ] Appointment status workflow (Scheduled → Confirmed / Cancelled / No-Show)

### Milestone 1.4 — SMS Reminder Engine (Sprint 7–8)
- [x] SMS template management UI
- [x] Template variables: `{{patient_name}}`, `{{date}}`, `{{time}}`, `{{provider}}`
- [ ] Twilio integration — send real SMS
- [ ] Scheduled reminders via BullMQ (24h, 48h, 7-day)
- [ ] Delivery status webhooks from Twilio
- [ ] Patient reply handling (confirm / cancel / reschedule)
- [ ] STOP / opt-out processing

### Milestone 1.5 — Analytics & Polish (Sprint 9–10)
- [x] Dashboard metrics cards
- [x] No-show trend chart
- [ ] Reminder delivery funnel visualization
- [ ] Provider-level breakdown report
- [ ] Export to CSV

---

## Phase 2 — Advanced Features (Q3 2026)
**Theme: Efficiency & Insight**  
**Goal:** Make the system smarter, faster, and more actionable for busy clinic staff.

### Milestone 2.1 — Bulk Operations
- [ ] Bulk reminder send from appointment list
- [ ] Batch reschedule appointments
- [ ] Multi-select patient operations

### Milestone 2.2 — Advanced Reminders
- [ ] Custom reminder schedules per appointment type
- [ ] Reminder chains (7-day → 48h → 24h → 2h) with configurable steps
- [ ] Personalized message variants (A/B test templates)
- [ ] Spanish language template support

### Milestone 2.3 — Rich Analytics
- [ ] Interactive no-show rate trend chart (12-month)
- [ ] SMS delivery funnel (sent → delivered → replied)
- [ ] Provider-level no-show leaderboard
- [ ] Patient engagement score per patient
- [ ] Downloadable PDF reports

### Milestone 2.4 — Two-Way SMS
- [ ] Reply parsing engine ("1" confirm, "2" cancel, "3" reschedule)
- [ ] Automated follow-up when patient cancels
- [ ] Staff notification on unrecognized replies
- [ ] SMS conversation history in patient profile

### Milestone 2.5 — Staff Productivity
- [ ] In-app notifications for patient replies and no-shows
- [ ] Daily digest email to practice manager
- [ ] Quick-action shortcuts (confirm/cancel from dashboard)
- [ ] Saved filters and views

---

## Phase 3 — Integrations & Scale (Q4 2026)
**Theme: Connect & Scale**  
**Goal:** Integrate with existing healthcare infrastructure and support larger practices.

### Milestone 3.1 — EHR Integration
- [ ] HL7 FHIR API bridge (read appointments from EHR)
- [ ] Epic MyChart integration (bidirectional sync)
- [ ] Athenahealth integration
- [ ] Generic webhook receiver for custom EHR push

### Milestone 3.2 — Multi-Provider SMS
- [ ] Vonage (Nexmo) as fallback provider
- [ ] AWS SNS integration
- [ ] Provider health monitoring and automatic failover
- [ ] Cost optimization — route via cheapest available carrier

### Milestone 3.3 — Multi-Location Support
- [ ] Multi-clinic/location within one account
- [ ] Per-location phone numbers and templates
- [ ] Location-level analytics and reporting
- [ ] Staff scoped to specific locations

### Milestone 3.4 — Security & Compliance
- [ ] SOC 2 Type II audit preparation
- [ ] HIPAA Business Associate Agreement (BAA) workflow
- [ ] Immutable audit log with export
- [ ] PHI access logging and alerts
- [ ] Data retention and purge policy controls

---

## Phase 4 — Intelligence & Expansion (Q1 2027)
**Theme: Predict & Personalize**  
**Goal:** Use AI and predictive analytics to further reduce no-shows and expand to new markets.

### Milestone 4.1 — Predictive No-Show Scoring
- [ ] ML model to predict no-show probability per appointment
- [ ] High-risk appointments highlighted on dashboard
- [ ] Extra reminder cadence auto-triggered for high-risk patients

### Milestone 4.2 — Smart Scheduling Suggestions
- [ ] Recommend optimal appointment times based on historical attendance patterns
- [ ] Identify recurring availability gaps and suggest schedule adjustments

### Milestone 4.3 — Patient Self-Service Portal
- [ ] Web portal for patients to confirm, cancel, or reschedule via link in SMS
- [ ] Appointment history and upcoming visits for patients
- [ ] Preference center (opt-in/out of reminder types, preferred contact time)

### Milestone 4.4 — Expansion Markets
- [ ] Dental practice vertical (specialized templates and appointment types)
- [ ] Veterinary clinic support
- [ ] Mental health practice mode (enhanced privacy — no PHI in SMS body)

---

## Backlog / Icebox

| Item | Priority | Notes |
|------|----------|-------|
| WhatsApp reminder channel | Medium | High demand in international markets |
| Email reminder fallback | Low | For patients without SMS capability |
| Native iOS/Android app | Low | Low ROI vs. responsive web |
| Patient-facing review request | Medium | Post-appointment satisfaction survey via SMS |
| Insurance eligibility check integration | Low | Phase 5 consideration |
| AI-generated personalized message content | Medium | Use GPT-4 to vary message tone |

---

## Release Cadence

| Release | Frequency | Contents |
|---------|-----------|----------|
| Patch (x.x.N) | As needed | Bug fixes, security patches |
| Minor (x.N.0) | Bi-weekly | Feature additions, performance improvements |
| Major (N.0.0) | Quarterly | Phase milestones, breaking changes |

---

## Dependencies & Risks

| Dependency | Risk Level | Contingency |
|------------|------------|-------------|
| Twilio SMS reliability | Medium | Add Vonage fallback in Phase 3 |
| A2P 10DLC registration | High | Begin registration 8 weeks before launch |
| HIPAA compliance review | High | Engage counsel in Sprint 5 |
| EHR vendor cooperation (Phase 3) | High | Start with webhook-based integration |
| Patient SMS opt-in rates | Medium | A/B test first message copy |

---

*Roadmap Owner: Product Team | Updated Quarterly | Feedback: product@clinic-reminders.io*
