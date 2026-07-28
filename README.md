# Crease

Mobile-first Progressive Web App for **Ranches Thunders**.

MVP roles: **Admin** and **Player** only. Admins are players who also manage the team.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui + Lucide
- TanStack Query · React Hook Form · Zod
- Supabase · PWA

## Architecture

Data flow: **Component → Hook → Service → Repository → Supabase**

Docs: [docs/PRODUCT.md](docs/PRODUCT.md) · [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/DATABASE.md](docs/DATABASE.md)

## Setup

```bash
cp .env.example .env.local
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

### Reset DB to MVP migrations

MVP replaced earlier schema migrations. On a linked project that already applied the old set, reset then push:

```bash
npx supabase db reset --linked   # destructive — wipes remote DB
# or: create a fresh Supabase project and link it
npx supabase db push --linked
npx supabase gen types typescript --linked > src/types/database.ts
```

### Dev seed + OTP

```bash
npm run seed:dev
```

Dummy logins: `9999900001`–`9999900004`, OTP `123456` (see `src/constants/dev-auth.ts`).

Enable `AUTH_DEV_FIXED_OTP` / `NEXT_PUBLIC_AUTH_DEV_OTP` in `.env.local` for local OTP bypass.

## Product scope (MVP)

- Weekend Sat/Sun matches (warmup / tournament)
- Availability + carpool polls
- WhatsApp group + PWA push schedules (IST)
- Weekend UPI settlement (UTR + compressed screenshot)
- Team fund + expenses + manual ₹300 asks
- Stitch Athletic Precision UI
