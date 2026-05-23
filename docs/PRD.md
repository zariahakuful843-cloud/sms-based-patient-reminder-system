# Product Requirements Document
## SMS-Based Patient Reminder System

**Version:** 1.0  
**Last Updated:** May 2026  
**Status:** Active

---

## 1. Executive Summary

The SMS-Based Patient Reminder System is a web application designed to help healthcare providers reduce no-show rates and improve patient engagement through automated, timely SMS reminders. The platform enables clinics and hospitals to manage patients, schedule appointments, and send targeted text message reminders — without requiring patients to install any app.

---

## 2. Problem Statement

Healthcare providers lose significant revenue and operational efficiency due to missed appointments. Studies show that no-show rates average **15–30%** across primary care and specialty practices. Current reminder methods (phone calls, postal mail) are labor-intensive, expensive, and often ignored by patients.

**Key pain points:**
- Staff spend 2–4 hours per day making manual reminder calls
- No-show rates result in an average of $150–$200 lost revenue per missed appointment
- Patients forget appointments scheduled weeks in advance
- Fragmented workflows — scheduling and reminders handled in separate tools
- No real-time visibility into reminder delivery and patient responses

---

## 3. Goals & Success Metrics

### Goals
1. Reduce patient no-show rates by at least 30% within the first 6 months
2. Eliminate manual reminder calls for routine appointments
3. Provide clinic staff with a simple, unified tool for patient and appointment management
4. Enable data-driven decisions through delivery and response analytics

### Success Metrics (KPIs)

| Metric | Baseline | 3-Month Target | 6-Month Target |
|--------|----------|----------------|----------------|
| No-show rate | 25% | 18% | 15% |
| Reminder open/response rate | — | 60% | 75% |
| Staff time saved on calls | 0 | 2 hrs/day | 3.5 hrs/day |
| Patient satisfaction score | 3.2/5 | 3.8/5 | 4.2/5 |
| SMS delivery rate | — | 95% | 98% |

---

## 4. User Personas

### Persona 1: Maria — Clinic Receptionist
- **Age:** 32
- **Goal:** Confirm appointments quickly without spending hours on the phone
- **Pain points:** Repetitive manual calls, no visibility on who confirmed, high call abandonment
- **Needs:** Simple interface to schedule reminders, see confirmation status at a glance

### Persona 2: Dr. Chen — Practice Manager
- **Age:** 48
- **Goal:** Reduce wasted appointment slots and improve clinic revenue
- **Pain points:** No visibility into no-show trends, can't identify chronic no-show patients
- **Needs:** Dashboard analytics, no-show reports, patient engagement scores

### Persona 3: James — IT Administrator
- **Age:** 41
- **Goal:** Maintain a secure, HIPAA-compliant system with minimal maintenance overhead
- **Pain points:** Data breaches, vendor lock-in, complex integrations
- **Needs:** Role-based access, audit logs, configurable SMS provider, API documentation

---

## 5. Scope

### In Scope (MVP — Phase 1)
- Patient profile management (create, edit, deactivate)
- Appointment scheduling and tracking
- SMS reminder creation using customizable templates
- Reminder scheduling (24h, 48h, 1-week before appointment)
- Real-time delivery and response status tracking
- Basic dashboard with key metrics
- Role-based access: Admin, Staff, Viewer

### Out of Scope (Future Phases)
- Native mobile app
- Two-way conversational SMS chatbot
- EHR/EMR direct integration (e.g., Epic, Cerner)
- Insurance claim processing
- Video/telehealth appointment support
- Multi-language SMS (beyond English/Spanish MVP)

---

## 6. Features & Requirements

### 6.1 Patient Management

**F-PM-01:** Create patient profiles with name, phone number, date of birth, email (optional), and provider assignment.  
**F-PM-02:** Edit and deactivate patient records (soft delete — data retained for compliance).  
**F-PM-03:** Search and filter patients by name, phone, or provider.  
**F-PM-04:** View per-patient reminder history and response log.  
**F-PM-05:** Flag chronic no-show patients automatically (≥3 no-shows in 6 months).

### 6.2 Appointment Management

**F-AM-01:** Create, reschedule, and cancel appointments linked to patient profiles.  
**F-AM-02:** Support appointment types: consultation, follow-up, lab, procedure.  
**F-AM-03:** Track appointment status: Scheduled, Confirmed, Cancelled, No-Show, Completed.  
**F-AM-04:** Bulk appointment import via CSV.  
**F-AM-05:** Calendar view of daily/weekly appointments.

### 6.3 SMS Reminders

**F-SR-01:** Send reminders at configurable intervals before the appointment (e.g., 7 days, 48h, 24h, 2h).  
**F-SR-02:** Customizable message templates with merge fields: `{{patient_name}}`, `{{date}}`, `{{time}}`, `{{provider}}`, `{{location}}`.  
**F-SR-03:** Patient reply handling: "1" to confirm, "2" to cancel, "3" to reschedule.  
**F-SR-04:** Automatic status updates based on patient replies.  
**F-SR-05:** Manual override — staff can send ad-hoc reminders from the appointment detail view.  
**F-SR-06:** Opt-out management — honor STOP replies and flag patient as opted-out.

### 6.4 Analytics & Reporting

**F-AR-01:** Dashboard with live metrics: reminders sent today, confirmed rate, pending, no-shows.  
**F-AR-02:** Time-series chart of no-show rates over the past 12 months.  
**F-AR-03:** Reminder delivery funnel: Sent → Delivered → Opened → Replied.  
**F-AR-04:** Provider-level no-show breakdown.  
**F-AR-05:** Export reports to CSV/PDF.

### 6.5 Settings & Configuration

**F-SC-01:** Configure SMS provider credentials (Twilio, AWS SNS, Vonage).  
**F-SC-02:** Set default reminder schedule (number of reminders, timing).  
**F-SC-03:** Manage clinic information (name, address, phone, timezone).  
**F-SC-04:** User management — invite staff, assign roles, revoke access.  
**F-SC-05:** Audit log of all system actions (reminder sends, patient edits, login events).

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Dashboard loads in < 2 seconds; reminder dispatch latency < 5 seconds |
| **Availability** | 99.9% uptime (< 8.7 hrs/year downtime) |
| **Security** | HTTPS only, AES-256 encryption at rest, PHI minimization |
| **Compliance** | HIPAA, TCPA (opt-in/opt-out management), SOC 2 Type II (target) |
| **Scalability** | Support up to 500 concurrent users; handle 100K SMS/day |
| **Accessibility** | WCAG 2.1 AA compliance |
| **Browser Support** | Chrome, Firefox, Safari, Edge — latest 2 versions |

---

## 8. Technical Architecture

### Frontend
- **Framework:** Next.js 16 (App Router) with TypeScript
- **Styling:** Tailwind CSS v4
- **State:** React Context + Server Components for data fetching

### Backend (Phase 2)
- **API:** Next.js API Routes / tRPC
- **Database:** PostgreSQL (patient/appointment data), Redis (job queue for scheduled SMS)
- **SMS:** Twilio (primary), Vonage (fallback)
- **Job Queue:** BullMQ for scheduled reminder dispatch
- **Auth:** NextAuth.js with RBAC

### Infrastructure
- **Hosting:** Vercel (frontend) + AWS (DB, queue)
- **Monitoring:** Sentry (errors), Datadog (metrics)
- **CI/CD:** GitHub Actions

---

## 9. Constraints & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SMS carrier filtering of health-related content | Medium | High | Use approved healthcare SMS sender IDs; A2P 10DLC registration |
| Patient opt-out rate higher than expected | Low | Medium | Provide clear value prop in first message; easy opt-back-in |
| HIPAA audit | Low | High | Engage HIPAA compliance counsel; BAA with SMS provider |
| Staff adoption resistance | Medium | Medium | Dedicated onboarding, training videos, in-app help |

---

## 10. Open Questions

1. Should the system support multi-location clinics with per-location SMS numbers?
2. What is the preferred SMS provider — does the clinic have an existing Twilio account?
3. Should patients be able to self-schedule via SMS reply ("3 to reschedule")?
4. What EHR systems are currently in use — is bi-directional sync required for MVP?
5. What languages should SMS templates support at launch?

---

*Document Owner: Product Team | Reviewers: Engineering, Compliance, Clinical Operations*
