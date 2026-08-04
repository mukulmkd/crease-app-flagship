# Architecture Decisions (MVP)

## ADR-001 — Mobile OTP + KMSI

Authentication is phone OTP only. Sessions persist until explicit sign-out.

**Why:** Cricket teams live on mobile; frictionless return visits matter.

---

## ADR-002 — Supabase platform

Auth, Postgres, Storage, Cron/Edge Functions on Supabase.

**Why:** One backend for MVP speed and RLS.

---

## ADR-003 — Two roles only

Roles are `admin` and `player`. Admins are members of the player pool and may play/vote.

**Why:** Matches real Ranches Thunders ops; avoids unused Captain/VC complexity.

---

## ADR-004 — Single team MVP

Product behavior is one team: Ranches Thunders. Schema retains `team_id`.

**Why:** Ship weekend ops fast; multi-team later without rewrite.

---

## ADR-005 — Match is the event aggregate

Weekend matches own availability poll, carpool poll, and fee line items.

**Why:** Ops are match-centric, not generic calendar-first.

---

## ADR-006 — Access requires membership

OTP alone is insufficient. Active `team_memberships` row required or access denied.

**Why:** Admin controls who is on the squad.

---

## ADR-007 — Repository + service layers

Repositories = CRUD. Services = validation, authz, orchestration, notification triggers.

**Why:** Keep UI free of business rules and Supabase clients.

---

## ADR-008 — Stitch Modern Cricket Club _(superseded)_

**Status:** Superseded by [ADR-011](#adr-011--modern-scorebook-utility).

Original MCC tokens (Barlow Condensed + Manrope, ivory `#F5F2E8`, clubhouse `#082417`, lime `#C9F64B`) shipped the MVP UI from Stitch project `5487252279778690236`.

**Supersedes:** Athletic Precision (`assets/6d86c10d6d484fecb655a86c604b00bc`).

---

## ADR-009 — Notification dual-channel

PWA push + existing WhatsApp group integration; schedules in Asia/Kolkata.

**Why:** Players already coordinate in WhatsApp; app must meet them there.

---

## ADR-010 — Dual token sources stay in sync

Canonical visual tokens live in both `src/styles/globals.css` and `src/constants/design-tokens.ts` (PWA theme colors, typography class strings).

**Why:** CSS drives Tailwind; TS drives metadata and shared class tokens. Drift breaks brand consistency across agents and builds.

---

## ADR-011 — Modern Scorebook Utility

**Status:** Current.

UI follows the original Crease **Modern Scorebook Utility** — see [UI.md](./UI.md)
and `.cursor/rules/12-design-system.mdc`.

**Typography:** Oswald (display/stats) + Plus Jakarta Sans (UI).
**Surfaces:** neutral stone `#F2F2F1`, clubhouse `#0A0C0B`, amber `#E0B84A` selection only.
**Dark (Neutral Night):** charcoal `#0C0E0D`; light-ink CTAs `#EDEEEB`. **No green / lime.**

**Why:** Quieter 2026 utility feel; remove green-room branding entirely.

**Supersedes:** ADR-008 (Modern Cricket Club). Palette further revised by ADR-012 / ADR-013.

---

## ADR-012 — Neutral Night dark theme

**Status:** Current (extends ADR-011; primary accents revised by ADR-013).

Dark mode uses neutral charcoal surfaces (`#0C0E0D` → `#2A302D`). Match tickets use near-black `#0A0C0B`.

**Why:** Green-tinted dark chrome made the app feel “in a green room.”

**Supersedes:** ADR-011 dark palette (green-charcoal).

---

## ADR-013 — Ink + Amber (no green)

**Status:** Current.

Brand and interactive colors drop pitch green and lime entirely.

| Role      | Value                               |
| --------- | ----------------------------------- |
| Primary   | Ink `#1A1A1A` (dark CTAs `#EDEEEB`) |
| Selection | Amber `#E0B84A`                     |
| Success   | Blue `#1A6BB5` / `#7EB6E0`          |
| Clubhouse | `#0A0C0B` both themes               |

**Why:** Explicit product preference against green; scorebook utility reads better as ink + amber highlight.

**Supersedes:** ADR-011 / ADR-012 green and lime accents.

---

## ADR-014 — Original task-first PWA system

**Status:** Current.

Crease no longer uses an external generated design system as an implementation
or reference dependency. Mobile navigation is fixed to Home, Matches, Team,
Pay, Profile; Fund and Settings move to the Profile hub on mobile. Player Home
prioritizes next match, voting, personal dues, then alerts. Admin lifecycle
actions use `ManageMatchSheet`.

Shared requirements: one `h1` per route, 12px minimum operational copy, 48px
default touch targets, keyboard-accessible exclusive controls, explicit
loading/empty/error/offline states, and non-disruptive PWA updates.

**Why:** The product needs a coherent cricket-operations utility optimized for
real installed-PWA tasks, not fidelity to an external frame set.

**Supersedes:** Any remaining implementation dependency on ADR-008.

---

## ADR-015 — One official app artwork

**Status:** Current.

The official Crease identity is a minimal amber C-shaped hand cradling an
off-white cricket ball on clubhouse black. The master raster lives at
`scripts/crease-app-logo-source.png`. `npm run icons:generate` derives the
browser favicon, Next App Router icon, Apple touch icon, standard PWA icons,
maskable icon, and SVG wrapper from that single source. `BrandMark` displays the
same artwork in app chrome.

**Why:** A single master prevents the installed icon, favicon, and in-app brand
from drifting into unrelated marks.
