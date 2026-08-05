# Pending Work

Single place to track follow-ups that are intentionally deferred until later testing or rollout.

## Current focus

### Profile / avatar

- Profile page + menu shortcuts are live (name edit, phone read-only, role chip)
- **Avatar photo upload** is live: public `avatars` bucket, square compress,
  replace deletes the previous storage object, menu/team lists use
  `resolveAvatarUrl` via `UserAvatar`

### Squad finalization + settlement

- Availability is an open pool (no hard yes-cap); playing XI/XII lives in
  `match_squad_members`
- Freeze auto-finalizes when yes is 11–12; Admin confirms after short-pool
  recruitment or picks when oversubscribed
- Post-match Admin carpool assignment (drivers/passengers) drives fees
- Fees bill **completed** matches + finalized squad + assigned carpool only
- Still pending E2E: Cron schedules, Mon AM settlement pass for Sunday matches

### Past match report — remaining polish

Done: squad strip, who-played roster, fee breakdown (player + Admin), weekend
settlement status, tournament name/fees, payment UTR/screenshot links, basic
timeline, ground/kickoff on the clubhouse ticket, post-match ride labels.

Still pending:

- **Tournament match index** — “Match 2 of 5” (needs ordered tournament fixture
  query; today we show planned count + total fees only)
- **Admin-override badges** — no `overridden` / audit flag on poll votes yet;
  cannot mark roster rows that Admin changed after freeze
- **Richer timeline timestamps** — freeze/notified times are coarse (date-level
  or boolean) until we persist dedicated event stamps

### End-to-end testing before Cron enablement

- Keep deployed Edge Functions unscheduled until manual end-to-end testing is complete:
  - `activate-weekend-matches`
  - `freeze-polls`
  - `strength-reminders`
  - `carpool-assignment-reminders`
  - `weekend-settlement`
- During E2E, manually invoke each function and verify:
  - future weekend stays scheduled at create; Monday publisher confirms it,
    activates polls only when enabled, and sends one squad notification
  - availability freeze for tomorrow when 11+ are available; below 11 stays
    open, alerts Admin, then waits for explicit Admin confirmation at 11–12
  - **carpool** freeze after kickoff for today's match (no auto-complete)
  - 14:00 Admin carpool-assignment reminder
  - yes-count reminders when squad is below 11
  - weekend settlement charge generation + credit netting / reimbursements
  - one retry-safe Sunday payment notification for Sat, Sun, or both

### Cron activation checklist

- `CRON_SECRET` is set in Supabase secrets, Vercel (production + preview), and
  `.env.local`; `APP_URL` is set in Supabase secrets — all four must hold the
  same secret or Cron pushes silently no-op
- Verify each function returns successful JSON on manual `curl`
- Add schedules in Supabase Dashboard Cron (or `pg_cron`):
  - `activate-weekend-matches` Monday **09:00 IST** (`30 3 * * 1` UTC)
  - `freeze-polls` daily **18:00 IST** (availability for tomorrow)
  - Prefer also scheduling `freeze-polls` **hourly** (or around weekend kickoffs) so carpool locks promptly after start
  - `carpool-assignment-reminders` daily **14:00 IST**
  - `strength-reminders` **12:00** & **21:00 IST**
  - `weekend-settlement` Sun **19:00 IST**
- Re-run verification after schedules are enabled

### Admin “Nudge unpaid in group”

- **In-app is live:** creates payment notifications for unpaid players only
  (`nudgeUnpaidWeekendPlayers` → `broadcastTeamNotificationAction` with
  `userIds`)
- **WhatsApp group is wired, not simulated:** POSTs `{ text }` to
  `teams.whatsapp_notify_url` (same pattern as match confirm / fund ask)
- Still pending before relying on it in production:
  - Configure a real group webhook URL on the team (Settings)
  - E2E: tap Nudge on weekend summary and confirm the group message lands
  - Without a URL (or if the webhook fails), the button still succeeds — WA
    is non-blocking and silently skipped

## Notes

- Core Admin flows are implemented and can be tested without scheduled Cron jobs
- Inbox + WhatsApp paths are the active notification channels
- Web Push / VAPID is live — Settings → Push alerts; OS banners when PWA is
  backgrounded. Cron `APP_URL` + `CRON_SECRET` are wired at
  `https://crease-app-flagship.vercel.app`; rotating the secret means updating
  Supabase secrets and Vercel together, then redeploying.
- App fan-out requires `SUPABASE_SERVICE_ROLE_KEY` on the server
  (`broadcastTeamNotificationAction`); without it broadcasts log a warning and skip

## Update convention

When something is completed:

1. remove it from this file, or
2. move it under a short `Done` section with date/context
