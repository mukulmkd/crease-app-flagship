# Architecture (MVP)

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Lucide React
- Supabase (Auth, Postgres, Storage, Cron/Edge)
- TanStack Query
- React Hook Form + Zod

## Principles

- Feature-first under `src/`
- UI → Hook → Service → Repository → Supabase
- Services own validation + authorization
- Repositories own CRUD only
- Original **Modern Scorebook Utility** via reusable components

## Folder structure

```
src/
├── app/
├── components/
├── features/          # match, poll, payment, fund, team, auth, …
├── hooks/
├── services/
├── repositories/
├── providers/
├── lib/               # errors, env, supabase clients, query, rbac, …
├── types/
├── constants/
└── styles/
```

## Domain aggregates (MVP)

```
Team (Ranches Thunders)
├── Memberships (admin | player)
├── Matches (weekend events)
│   ├── Availability poll
│   ├── Carpool poll
│   └── Settlement line items
├── Tournaments
├── Weekend settlements
├── Team fund + expenses
└── Notifications
```

Profile is the logged-in person; **membership** grants access. Admins remain players for polls and payments.

## Auth & session

- Supabase Auth phone OTP
- Dev fixed OTP path for local testing
- Persistent session (KMSI) until `signOut`
- Route guard: public auth routes → membership gate → profile completion → app

## Jobs / notifications

Scheduled in **Asia/Kolkata** (Supabase Cron + Edge Functions):

- Strength reminders 12:00 / 21:00
- Eve summary 18:00 (match day − 1)
- Sunday 19:00 settlement
- One weekend payment notification Sunday 19:00 (retry-safe)
- Event-driven: confirm, vote flip, frozen-poll edit, fund ask

## Scheduled jobs (Edge Functions)

Functions under `supabase/functions/`:

| Function                       | IST schedule                    | Purpose                                                                           |
| ------------------------------ | ------------------------------- | --------------------------------------------------------------------------------- |
| `freeze-polls`                 | Daily 18:00 (+ optional hourly) | Freeze availability for tomorrow; freeze carpool after kickoff (no auto-complete) |
| `carpool-assignment-reminders` | Daily 14:00 IST                 | Admin-only: assign post-match carpool rides                                       |
| `strength-reminders`           | 12:00 & 21:00                   | Remind non-voters when yes &lt; 11                                                |
| `weekend-settlement`           | Sun 19:00                       | Generate charges + pay CTA                                                        |
| `unpaid-reminders`             | Disabled                        | Deprecated no-op; payment CTA is Sunday-only                                      |

Auth: `Authorization: Bearer $CRON_SECRET` or `x-cron-secret`.  
Migration `20260729120000_enable_cron_extensions.sql` enables `pg_cron` + `pg_net`. Wire Dashboard Cron (or `cron.schedule` + `net.http_post`) after deploy. Secrets: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.

## Database

- SQL: `supabase/migrations/`
- Model: [DATABASE.md](./DATABASE.md)
- Regenerate types: `npx supabase gen types typescript --linked`

## Related

- [PRODUCT.md](./PRODUCT.md)
- [ARCHITECTURE/platform-overview.md](./ARCHITECTURE/platform-overview.md)
- [DECISIONS.md](./DECISIONS.md)
- [UI.md](./UI.md)
