# ADR-0003: Membership-gated access

## Status

Accepted

## Date

2026-07-28

## Context

Anyone with a phone could complete OTP. Squad control requires Admin to add players before app use.

## Decision

- Active `team_memberships` row for Ranches Thunders is mandatory
- Without it: access denied on all app routes/APIs
- Profile completion is a second gate after membership

## Consequences

- Auth ≠ authorization
- Admin onboarding path (add player by phone) is critical path
- Seed/dev scripts must create memberships for test users
