# SMS-Based Patient Reminder System

A web-based application built for health facilities in Ghana to manage patients, appointments, and automated SMS reminders — reducing missed appointments through reliable, locally-integrated SMS communication.

## Overview

This system allows healthcare staff to register patients, schedule appointments, and automatically send SMS reminders to patients through the Arkesel SMS gateway. Reminders are automatically created when an appointment is booked, automatically cancelled if the appointment's status changes, and automatically sent via a scheduled background task — requiring no manual intervention once an appointment is created.

## Key Features

- **Role-based access control** for four user types: Administrator, Receptionist, Doctor, and Nurse
- **Patient management**, including bulk import via CSV/Excel upload with a downloadable template
- **Appointment scheduling** with automatic status tracking (Scheduled, Completed, Cancelled, Missed)
- **Automated SMS reminders**, automatically scheduled 1 day before each appointment, with automatic cancellation if the appointment is no longer active
- **Single and bulk SMS sending**, with live message preview and character/SMS-unit counting
- **Reports and analytics**, including exportable PDF and Excel reports
- **Real SMS delivery** via the Arkesel SMS gateway, integrated with Ghanaian mobile networks (MTN, Telecel, AirtelTigo)

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Database:** PostgreSQL, hosted on Supabase
- **ORM:** Prisma
- **Styling:** Tailwind CSS
- **Authentication:** bcrypt (password hashing) + JOSE (JWT sessions)
- **SMS Gateway:** Arkesel
- **Hosting:** Vercel, with Vercel Cron for automated reminder dispatch
- **File parsing:** Papaparse (CSV), xlsx (Excel)
- **Export:** jsPDF, xlsx

## Getting Started

First, install dependencies:

```bash
npm install
```

Set up your environment variables in a `.env` file:


Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

This project is deployed on [Vercel](https://vercel.com), with automatic deployment on every push to the main branch. A scheduled cron job (configured in `vercel.json`) runs daily to dispatch any due SMS reminders automatically.

## Project Context

This system was developed as a final-year BTech project, addressing the problem of missed patient appointments at Ghanaian health facilities through automated, locally-adapted SMS communication.
