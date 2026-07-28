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
- Stitch design via reusable components (never paste Stitch HTML)

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
├── lib/platform/      # Supabase platform barrel
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
- Unpaid reminders 10:00 / 19:00
- Event-driven: confirm, vote flip, frozen-poll edit, fund ask

## Database

- SQL: `supabase/migrations/`
- Model: [DATABASE.md](./DATABASE.md)
- Regenerate types: `npx supabase gen types typescript --linked`

## Related

- [PRODUCT.md](./PRODUCT.md)
- [ARCHITECTURE/platform-overview.md](./ARCHITECTURE/platform-overview.md)
- [DECISIONS.md](./DECISIONS.md)
- [UI.md](./UI.md)
