# Crease Database (MVP)

SQL lives in `supabase/migrations/`. Regenerate TS types after apply:

```bash
npx supabase db push --linked
npx supabase gen types typescript --linked > src/types/database.ts
```

**Tenancy:** single product team **Ranches Thunders** (seeded). All domain rows scoped by `team_id`.

**Roles:** `membership_role = admin | player` only.

---

## ER (textual)

```
auth.users
    │ 1:1
    ▼
profiles
    │
    ▼
team_memberships ──► teams (Ranches Thunders)
                         │
                         ├─► tournaments
                         │
                         ├─► matches ──► tournaments?
                         │      │
                         │      ├─► polls (availability | carpool)
                         │      │      └─► poll_votes ──► profiles
                         │      │
                         │      └─► settlement_charges ──► weekend_settlements
                         │
                         ├─► weekend_settlements ──► settlement_charges
                         │                              └─ payment proof fields
                         │
                         ├─► team_fund_accounts ──► team_fund_transactions
                         │                      └─► expenses
                         │                      └─► fund_contribution_asks
                         │
                         └─► notifications
```

---

## Tables

| Table                    | Purpose                                             |
| ------------------------ | --------------------------------------------------- |
| `profiles`               | Name, phone, avatar, profile_completed_at           |
| `teams`                  | Ranches Thunders + settings (UPI, WhatsApp hook)    |
| `team_memberships`       | admin/player + status                               |
| `tournaments`            | Name, planned_match_count, total_fees_inr           |
| `matches`                | Weekend match event (warmup/tournament, TBD fields) |
| `polls`                  | Per-match availability + carpool                    |
| `poll_votes`             | One row per voter (latest choice)                   |
| `weekend_settlements`    | Weekend fee rollup                                  |
| `settlement_charges`     | Per player amounts + UTR/screenshot/status          |
| `team_fund_accounts`     | Running balance                                     |
| `team_fund_transactions` | Ledger                                              |
| `expenses`               | Admin expenses                                      |
| `fund_contribution_asks` | Manual ₹300 asks                                    |
| `notifications`          | In-app notification rows                            |

---

## Key constraints

- Membership unique `(team_id, user_id)`
- Match date must be Saturday or Sunday (check constraint)
- Match start_time preferred `06:30` / `09:30` (app-enforced; DB allows time)
- Poll unique `(match_id, type)`
- Vote unique `(poll_id, user_id)`
- Carpool fee constant **100 INR** (app constant; stored on charge row)
- Availability soft cap 12 enforced in service

---

## RLS intent

- Enabled on all `public` tables
- `authenticated` may read/write only if `app_is_active_member(team_id)`
- Admin-only writes gated with `app_is_team_admin(team_id)`
- Users update only their own profile / own votes / own payment proofs
- Storage bucket `payment-proofs`: owner upload + team admin read

---

## Seed

Migration seeds team **Ranches Thunders** (`slug = ranches-thunders`) and an empty fund account. Admins/players are added via app or `seed:dev` script — not hard-coded production phones in SQL.
