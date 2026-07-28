# ADR-0001: Two roles — Admin and Player

## Status

Accepted

## Date

2026-07-28

## Context

Earlier drafts assumed Admin / Captain / Vice Captain / Player. Ranches Thunders MVP only needs team admins and players. Admins are chosen from the same player pool and still play.

## Decision

- `membership_role` enum: `admin` | `player`
- Admin permissions are a superset for management; participation uses the same poll/payment flows as players
- No Captain or Vice Captain roles in schema, permissions, or UI

## Consequences

- Simpler RBAC and fewer screens
- Permission maps and RLS helpers only check admin vs member
- Future roles require a new ADR + migration
