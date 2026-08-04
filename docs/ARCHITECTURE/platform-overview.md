# Crease Platform Overview (MVP)

## Vision

Crease runs weekend cricket operations for **Ranches Thunders** as an installable mobile PWA.

Architecture: feature modules + clean layers (presentation → query hooks → services → repositories → Supabase).

---

## Core aggregates

```
Team (Ranches Thunders)
│
├── Members (admin | player)
│
├── Tournaments
│
├── Matches
│     ├── Availability poll + votes
│     ├── Carpool poll + votes
│     └── Fee line items
│
├── Weekend settlements
│
├── Team fund
│     ├── Expenses
│     └── Contribution asks
│
└── Notifications
```

**Profile** = auth identity. **Membership** = access. No separate “Player aggregate” table is required for MVP beyond profile + membership (cricket prefs may live on `profiles`).

---

## Layers

```
Presentation (app / features / components)
        ↓
Query hooks (TanStack Query)
        ↓
Application services (authz + rules)
        ↓
Repositories (CRUD)
        ↓
Supabase (Postgres + Auth + Storage)
```

---

## Feature modules (MVP)

| Feature         | Owns                                  |
| --------------- | ------------------------------------- |
| `auth`          | OTP, KMSI session, profile completion |
| `team`          | Members, settings, access gate        |
| `match`         | Weekend match create/confirm/freeze   |
| `tournament`    | Tournament create from match sheet    |
| `poll`          | Availability + carpool polls          |
| `payment`       | Weekend settlement, UTR, screenshots  |
| `fund`          | Balance, expenses, ₹300 asks          |
| `notifications` | Inbox + schedule triggers             |
| `dashboard`     | Summary widgets only                  |

---

## Service ownership

One service façade per feature. Cross-feature orchestration (e.g. confirm match → create polls → notify) lives in the match (or dedicated orchestration) service, composing repositories — never calling Supabase from UI.

---

## Tenancy

MVP is **single-team**. Rows still carry `team_id` pointing at Ranches Thunders so multi-team can return later without a rewrite.

---

## Authorization

- Roles: `admin` | `player`
- Admin ⊆ player capabilities for participation
- `hasPermission()` in UI and services
- Non-members: hard deny

---

## UI system

Visual source of truth: the original Crease **Modern Scorebook Utility** — see
[UI.md](../UI.md) and `.cursor/rules/12-design-system.mdc`.

Agents must keep `globals.css` and `design-tokens.ts` aligned, use Oswald for
display/stats and Plus Jakarta Sans for UI, and build screens from shared React
components. Palette is **Ink + Amber** (no green/lime); dark is **Neutral Night**.
