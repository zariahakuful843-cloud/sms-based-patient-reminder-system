# AGENTS.md

## Cursor Cloud specific instructions

This is an SMS-Based Patient Reminder System for health facilities in Ghana, built with Next.js 16 (App Router), PostgreSQL, Prisma ORM 7, and NextAuth.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Next.js dev server | `npm run dev` | 3000 | Hot reload enabled |
| PostgreSQL | `sudo docker compose up -d` | 5432 | Must start before dev server |

### Startup sequence

1. Start Docker daemon: `sudo dockerd &` (wait ~3s)
2. Start PostgreSQL: `sudo docker compose up -d`
3. Run migrations: `npx prisma migrate dev` (if schema changed)
4. Generate Prisma client: `npx prisma generate`
5. Start dev server: `npm run dev`

### Common commands

- **Dev server:** `npm run dev`
- **Lint:** `npm run lint`
- **Build:** `npm run build`
- **DB migrate:** `npm run db:migrate`
- **DB seed:** `npm run db:seed`
- **Prisma Studio:** `npm run db:studio` (DB GUI on port 5555)

### Key architecture decisions

- **Prisma 7** requires a driver adapter (`@prisma/adapter-pg`). The `PrismaClient` constructor takes `{ adapter }` not `{ datasourceUrl }`.
- **Middleware** uses `auth.config.ts` (lightweight, no DB imports) to avoid Edge runtime issues. Full auth with credentials provider is in `lib/auth.ts`.
- **SMS sending** falls back to mock mode when `HUBTEL_CLIENT_ID` is not set — messages log as sent with `mock-*` IDs.
- **Reminders** are created automatically when appointments are scheduled. Process them manually via the UI "Process Now" button or POST to `/api/reminders` with `{ action: "process" }`.

### Test credentials

- Admin: `admin@clinic.gh` / `admin123`
- Staff: `nurse@clinic.gh` / `staff123`

### Gotchas

- The `app/page.tsx` file was removed; the dashboard lives at `app/(dashboard)/page.tsx`. Do not recreate a root page.tsx.
- Zod in this project uses `.issues` not `.errors` for validation error access.
- Next.js 16 shows a deprecation warning about middleware → proxy; this can be ignored for now.
