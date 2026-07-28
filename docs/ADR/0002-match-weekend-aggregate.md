---
title: Match as weekend event aggregate
---

# ADR-0002: Match as weekend event aggregate

## Status

Accepted

## Date

2026-07-28

## Context

Generic multi-type Event calendars over-modeled MVP needs. Ops are weekend Sat/Sun matches with polls and fees.

## Decision

- Primary operational entity is `matches`
- Allowed days: Saturday and/or Sunday
- Classification: `warmup` | `tournament`
- On create/confirm: system owns availability + carpool polls
- Settlement rolls up weekend matches into `weekend_settlements`

## Consequences

- Polls always belong to a match
- Notification schedules key off match dates in IST
- Practice/meeting/social event types are out of MVP
