# Crease — Product (MVP)

## Vision

Crease is a mobile-first Progressive Web App for **Ranches Thunders** — weekend match ops, polls, carpool, fee settlement, and team funds — with a native-quality UI matching Stitch Athletic Precision.

## Target users

| Role       | Description                                             |
| ---------- | ------------------------------------------------------- |
| **Admin**  | Team admin from the player pool; can also play and vote |
| **Player** | Active squad member                                     |

Only these two roles exist in MVP.

## Single team

MVP ships with one team: **Ranches Thunders**.

Users who are not active members get **access denied** on every app screen.

## Platforms

- Primary: installable PWA on iOS and Android
- Secondary: responsive desktop web

## Authentication

- Mobile OTP
- Dummy OTP for local/dev testing
- Keep Me Signed In until the user explicitly signs out

## Core flows

### Weekend matches (Admin)

1. Add players (gate for app access)
2. Create Sat and/or Sun match(es) — warmup or tournament
3. Tournament: select existing or create via bottom sheet (name, # matches, fees)
4. Enter opposition, Maps link, time (6:30 / 9:30 AM), match fees — TBD allowed
5. System prepares availability + carpool polls; Admin confirms → WhatsApp + push
6. Track strength (min 11 ideal, max 12); scheduled reminders until match day − 1
7. Freeze polls on match day − 1 (Admin override only)
8. Match day − 1 6 PM: squad + carpool summary
9. Sunday 7 PM: weekend fee calculation + pay CTA
10. Payment reminders until settled; Admin may mark offline paid

### Team fund (Admin)

- Track balance (import historical offline data)
- Add expenses (balance updates)
- Manually ask ₹300 contributions when needed

### Player

- OTP login + mandatory profile completion
- Vote availability + carpool; change until freeze
- Pay via UPI, submit UTR + compressed screenshot

## Design

- Top-tier 2026 utility-app UX
- Strict Stitch Athletic Precision fidelity
- Large touch targets, clear hierarchy, native chrome patterns

## Explicitly out of MVP

- Multi-team product UX
- Captain / Vice Captain / other roles
- Automated fund contribution charging
- Heavy analytics / reporting suite
