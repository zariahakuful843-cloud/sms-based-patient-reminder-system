# TODO - SMS & Reminders Page Redesign (UI only)

## Step 1: Gather required backend data contracts
- [x] Confirm SMS stats availability via `/api/reports` (sms.total, sms.sent, sms.failed)
- [x] Confirm scheduled reminders availability via `/api/sms/scheduled`
- [x] Confirm send-due processing via `/api/sms/scheduled/send-due`
- [x] Confirm SMS logs availability via `/api/sms/logs`
- [x] Confirm test SMS endpoint `/api/sms/test` is admin-restricted

## Step 2: Implement UI redesign
- [x] Edit ONLY `app/(dashboard)/sms/page.tsx`
- [ ] Replace tab navigation with 2 primary tabs: Automatic Reminders + Manual SMS
- [ ] Add statistics cards using backend values (no derivations that aren’t already in backend)
- [ ] Implement Automatic Reminders tab:
  - [ ] Automatic Reminder Service card + placeholder if metadata missing
  - [ ] Upcoming Scheduled Reminders (table)
  - [ ] Consolidate Reminder Queue + Reminder History without duplicating dataset
  - [ ] Move Send Due Now button here
- [ ] Implement Manual SMS tab:
  - [ ] Select Patient
  - [ ] Phone Number
  - [ ] Reminder Type
  - [ ] Appointment Date/Time
  - [ ] Editable Message
  - [ ] Reset to Default Template action
  - [ ] Conversation-style preview with recipient, reminder type, message, char count
- [ ] Keep Bulk SMS under collapsed “More Actions” section (preserve existing API calls)
- [ ] Keep Recent SMS Activity as a single responsive table:
  - [ ] Search
  - [ ] Date range filter
  - [ ] Status filter
  - [ ] Pagination
- [ ] Preserve existing functionality (send single, bulk, schedule create, delete, send due, send test)

## Step 3: Validate build
- [ ] Run typecheck / lint (if available)
- [ ] Run Next.js build (if feasible)

