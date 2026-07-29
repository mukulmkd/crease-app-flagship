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

## ADR-008 — Stitch Modern Cricket Club

UI must match Stitch project `5487252279778690236` design system **Modern Cricket Club** (`assets/11807811405223687109`). Rebuild with reusable React components; never paste Stitch HTML.

**Typography:** Barlow Condensed (display/stats) + Manrope (UI).  
**Surfaces:** ivory canvas `#F5F2E8`, clubhouse match tickets `#082417`, lime `#C9F64B` for selected accents only.

**Why:** Native-quality, ownable sports branding; Athletic Precision / Roboto Flex was too generic for Crease.

**Supersedes:** Athletic Precision (`assets/6d86c10d6d484fecb655a86c604b00bc`).

---

## ADR-009 — Notification dual-channel

PWA push + existing WhatsApp group integration; schedules in Asia/Kolkata.

**Why:** Players already coordinate in WhatsApp; app must meet them there.

---

## ADR-010 — Dual token sources stay in sync

Canonical visual tokens live in both `src/styles/globals.css` and `src/constants/design-tokens.ts` (PWA theme colors, typography class strings, stitch metadata).

**Why:** CSS drives Tailwind; TS drives metadata and shared class tokens. Drift breaks brand consistency across agents and builds.
