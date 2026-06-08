# TODO - SMS & Reminders Module

## SMS integration + message templates
- [ ] Update `lib/sms.ts` to use env vars `ARKESEL_API_KEY`, `ARKESEL_SMS_URL`, `ARKESEL_SENDER_ID`.
- [ ] Sender fallback: if `ARKESEL_SENDER_ID` missing, use `SMSReminder`.
- [ ] Implement reminder message generator for the 6 reminder types exactly as specified.

## Database
- [ ] Update `prisma/schema.prisma` to add `ScheduledReminder` model.
- [ ] Create/update migration.

## Backend APIs
- [ ] Add `app/api/sms/send-single/route.ts` (store SMS in `SMSLog`).
- [ ] Add `app/api/sms/send-bulk/route.ts` (bulk send + per-recipient `SMSLog`).
- [ ] Add `app/api/sms/test/route.ts` (admin test SMS feature).
- [ ] Add `app/api/sms/scheduled/route.ts`:
  - [ ] CRUD/list scheduled reminders
  - [ ] Endpoint to execute due reminders (scheduledAt <= now)

## Frontend (UI)
- [ ] Rewrite `app/(dashboard)/sms/page.tsx` into the required module:
  - [ ] Send Single SMS (required fields + message preview)
  - [ ] Send Bulk SMS
  - [ ] SMS History table
  - [ ] Scheduled Reminders section
  - [ ] Failed Messages view
- [ ] Add loading indicators, success/error handling.
- [ ] Ensure responsive layout.

## Verification
- [ ] `npm run dev`
- [ ] `npx prisma migrate dev`
- [ ] `npx prisma generate`
- [ ] Manual tests: send single, bulk send, test SMS, scheduled reminders execution, history + failed filters.

