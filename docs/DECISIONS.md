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

## ADR-008 — Stitch Athletic Precision

UI must match Stitch project design system; rebuild with reusable React components.

**Why:** Native-quality, consistent PWA chrome.

---

## ADR-009 — Notification dual-channel

PWA push + existing WhatsApp group integration; schedules in Asia/Kolkata.

**Why:** Players already coordinate in WhatsApp; app must meet them there.
