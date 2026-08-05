# Notifications — system audit

Single place for how Crease delivers alerts today: channels, entry points,
schedule readiness, and gaps vs product design
(`.cursor/rules/22-notifications.mdc`).

Related: [docs/FEATURES/notifications.md](./docs/FEATURES/notifications.md)
(feature UI notes) · [PENDING.md](./PENDING.md) (Cron enablement checklist).

**Last audited:** August 2026.

---

## Headline

Event-driven fan-out (inbox + Web Push + WhatsApp) works from app mutations
today. All six Edge Functions are deployed with `CRON_SECRET` + `APP_URL`
wired, but **`pg_cron.job` is empty** — every time-based product trigger is
still manual-only until schedules are enabled after E2E.

| Bucket                    | Count |
| ------------------------- | ----: |
| Event-driven live         |    11 |
| Cron coded, not scheduled |     5 |
| Design gaps               |     2 |
| Channels                  |     3 |

---

## Channels

| Channel           | Mechanism                                                                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **In-app inbox**  | Rows in `notifications`. RLS: members SELECT/UPDATE own; only Admin may INSERT from a session. Foreground: Realtime INSERT → toast + Crease chime. Bell sheet, Home “Recent alerts”, deep link `/home?alerts=1`.                    |
| **Web Push (OS)** | `push_subscriptions` → `web-push` + VAPID in Next.js (private key never hits Deno). App path: `sendWebPushToUsers`. Cron path: `POST $APP_URL/api/internal/push`. Service worker always calls `showNotification` (iOS requirement). |
| **WhatsApp**      | POST `teams.whatsapp_notify_url`. Group: `{ text }`. Individual: `{ text, phones }` (E.164 from profiles). Non-blocking; skipped when URL is null.                                                                                  |

Delivery failures are logged and **never** fail the triggering mutation.

---

## Architecture

```
Trigger (UI mutation / Cron Edge Function)
  ├─ App path
  │    broadcastTeamNotificationAction
  │      → membership re-check
  │      → service-role batch insert (notifications)
  │      → void sendWebPushToUsers(...)
  │      → optional fetch(whatsapp_notify_url)
  └─ Cron path
       enqueueForActiveMembers / enqueueForUsers / per-row insert
         → dispatchAppWebPush → POST $APP_URL/api/internal/push
         → notifyWhatsApp(...)
```

**Notes**

- `adminOnly` on `broadcastTeamNotificationAction` means **caller must be
  Admin**, not “admins-only recipients”. Recipient filter is
  `recipients: "admins"` or `userIds`.
- Player-triggered fan-out (availability flip) is fire-and-forget so the voter
  does not wait on delivery.
- App fan-out needs `SUPABASE_SERVICE_ROLE_KEY` on the server.
- Cron push needs matching `CRON_SECRET` in Supabase secrets **and** Vercel,
  plus `APP_URL` in Supabase secrets pointing at the public app origin.

---

## Product design triggers

Source of truth: `.cursor/rules/22-notifications.mdc`.

| When (product)                  | What                                | Channels                              | Status                                      | Entry point                                                      |
| ------------------------------- | ----------------------------------- | ------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| Match confirmed                 | Vote CTA (availability + carpool)   | Inbox · Push · WA group               | **Live** (immediate); Cron path unscheduled | `MatchService.notifyMembersToVote` · `activate-weekend-matches`* |
| Daily **12:00** & **21:00** IST | Remind non-voters if yes &lt; 11    | Inbox · WA individual · **no Push**   | Code ready · unscheduled                    | `strength-reminders`*                                            |
| Pre-freeze 13th+ yes            | Admin-only oversubscribe alert      | Inbox · Push                          | **Live**                                    | `notifyAdminOversubscribedVote`                                  |
| Vote flips yes → no             | Ask others if available             | Inbox · Push                          | **Live**                                    | `notifyAvailabilityFlip`                                         |
| Match day −1 · **18:00** IST    | Finalize at 11–12; else alert Admin | Inbox · Push · WA group (on finalize) | Admin live; Cron unscheduled                | `freeze-polls`* · Admin `freezeAvailability`                     |
| Admin confirms 11–12            | Squad-final notification            | Inbox · Push · WA group               | **Live**                                    | `notifySquadFinalized` (`finalizePlayingSquad`)                  |
| Match day · **14:00** IST       | Admin assign carpool rides          | Inbox · Push · WA individual          | Code ready · unscheduled                    | `carpool-assignment-reminders`*                                  |
| Sunday · **19:00** IST          | One weekend payment CTA             | Inbox · Push · WA individual          | Code ready · unscheduled                    | `weekend-settlement`*                                            |
| Admin edits frozen poll         | Re-notify participation changes     | Partial (yes→no only)                 | **Gap**                                     | Only `notifyAvailabilityFlip`; overrides do not fan out          |
| Admin fund ask                  | Contribution request (any amount)   | Inbox · Push · WA group               | **Live**                                    | `FundService.createAndSendContributionAsk`                       |

\* Edge Function — implemented, not in `pg_cron.schedule` yet.

---

## Complete entry-point catalog

### Event-driven (app mutations)

| Trigger                                 | Recipients                  | Type      | Channels                | Status                                        |
| --------------------------------------- | --------------------------- | --------- | ----------------------- | --------------------------------------------- |
| Immediate weekend create / Enable polls | All active                  | `match`   | Inbox · Push · WA group | Live                                          |
| Availability yes → no                   | All except voter            | `poll`    | Inbox · Push            | Live                                          |
| Pre-freeze yes &gt; max (13+)           | Admins only                 | `poll`    | Inbox · Push            | Live                                          |
| Admin freeze with yes &lt; min          | Admins only                 | `poll`    | Inbox · Push            | Live                                          |
| Admin freeze / finalize at 11–12        | All active                  | `poll`    | Inbox · Push · WA group | Live                                          |
| Oversubscribed freeze (pool only)       | —                           | —         | None                    | By design · silent                            |
| Admin unfreeze availability             | All active                  | `poll`    | Inbox · Push            | Live (extra vs product table)                 |
| Fund contribution ask                   | All active                  | `fund`    | Inbox · Push · WA group | Live                                          |
| Admin nudge unpaid                      | Unpaid players (+ WA group) | `payment` | Inbox · Push · WA group | Live (extra)                                  |
| Organizer payout reminder (once)        | Admins                      | `payment` | Inbox · Push · WA group | Live (extra)                                  |
| Manual Generate weekend fees            | —                           | —         | None                    | By design · silent (`notified_at` stays null) |
| Demo alert (demo mode)                  | Self or team                | `system`  | Inbox · Push            | Live (demo only)                              |

### Scheduled (Edge Functions)

| IST schedule                                  | Function                       | Recipients                | Type      | Channels                     | Status                                   |
| --------------------------------------------- | ------------------------------ | ------------------------- | --------- | ---------------------------- | ---------------------------------------- |
| Mon **09:00**                                 | `activate-weekend-matches`     | All active                | `match`   | Inbox · Push · WA group      | Unscheduled                              |
| **12:00** & **21:00**                         | `strength-reminders`           | Non-voters (yes &lt; min) | `poll`    | Inbox · WA individual        | Unscheduled · **no Web Push**            |
| Daily **18:00** (+ prefer hourly for carpool) | `freeze-polls`                 | Admins / all on finalize  | `poll`    | Inbox · Push · WA group      | Unscheduled                              |
| Daily **14:00**                               | `carpool-assignment-reminders` | Admins                    | `match`   | Inbox · Push · WA individual | Unscheduled                              |
| Sun **19:00**                                 | `weekend-settlement`           | Charged users             | `payment` | Inbox · Push · WA individual | Unscheduled                              |
| —                                             | `unpaid-reminders`             | —                         | —         | None                         | Stub / deprecated (`{ disabled: true }`) |

Intended cron expressions (from `PENDING.md`):

| Function                       | Cron (UTC)                      | Notes                                            |
| ------------------------------ | ------------------------------- | ------------------------------------------------ |
| `activate-weekend-matches`     | `30 3 * * 1`                    | Monday 09:00 IST                                 |
| `freeze-polls`                 | Daily 18:00 IST + prefer hourly | Availability for tomorrow; carpool after kickoff |
| `carpool-assignment-reminders` | Daily 14:00 IST                 | Idempotent via `carpool_assignment_reminded_at`  |
| `strength-reminders`           | 12:00 & 21:00 IST               | Until match day − 1                              |
| `weekend-settlement`           | Sun 19:00 IST                   | Claims `weekend_settlements.notified_at`         |

Keep functions unscheduled until manual E2E (see `PENDING.md`).

---

## Gaps vs product design

### 1. Frozen-poll re-notify (incomplete)

Product: Admin edits after freeze re-notify participation changes.

Today: only a **yes → no** availability flip fans out. Carpool overrides and
other post-freeze edits do not broadcast.

### 2. Strength reminders skip Web Push

`strength-reminders` inserts inbox rows in a loop and sends individual
WhatsApp, but never calls `dispatchAppWebPush` — locked / background devices
get no OS banner for the 12:00 / 21:00 nudges.

### Unused / extras

| Item                           | Notes                                              |
| ------------------------------ | -------------------------------------------------- |
| `membership` notification type | Exists in enum; **never emitted**                  |
| Availability reopened          | Extra — Admin unfreeze notifies all                |
| Unpaid nudge                   | Extra — Admin button on payments                   |
| Organizer payout reminder      | Extra — once when fees collected but proof missing |
| Demo `system` alerts           | Demo mode only                                     |

---

## Notification types

Canonical enum (`src/constants/domain/enums.ts`):

| Type         | Used?                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| `match`      | Yes — vote CTA, carpool assignment reminder                              |
| `poll`       | Yes — flip, oversub, incomplete, squad locked, reopen, strength reminder |
| `payment`    | Yes — weekend fees, unpaid nudge, organizer payout                       |
| `fund`       | Yes — contribution ask                                                   |
| `membership` | Never used                                                               |
| `system`     | Yes — demo only                                                          |

Informational `data.event` keys (not a DB enum): `weekend_published`,
`vote_submitted`, `squad_finalized`, `squad_oversubscribed`,
`squad_incomplete`, `availability_reopened`, `reminder`,
`carpool_assignment_reminder`, `organizer_payout_reminder`, plus demo
`{ demo: true, scope }`.

---

## Module map

### Server

| Role                   | Path                                                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fan-out action         | `src/services/notification.actions.ts`                                                                                                            |
| Push CRUD actions      | `src/services/push.actions.ts`                                                                                                                    |
| Inbox service          | `src/services/notification.service.ts`                                                                                                            |
| Match emitters         | `src/services/match.service.ts` (`notify*` ~1268+)                                                                                                |
| Fund emitter           | `src/services/fund.service.ts`                                                                                                                    |
| Payment emitters       | `src/services/payment.service.ts`                                                                                                                 |
| Notification repo      | `src/repositories/notification.repository.ts`                                                                                                     |
| Push subscription repo | `src/repositories/push-subscription.repository.ts`                                                                                                |
| Internal push API      | `src/app/api/internal/push/route.ts`                                                                                                              |
| Web Push send          | `src/lib/push/send-web-push.ts`                                                                                                                   |
| Cron shared helpers    | `supabase/functions/_shared/cron.ts`                                                                                                              |
| Edge Functions         | `supabase/functions/{activate-weekend-matches,freeze-polls,strength-reminders,carpool-assignment-reminders,weekend-settlement,unpaid-reminders}/` |

### Client

| Role               | Path                                                               |
| ------------------ | ------------------------------------------------------------------ |
| Quiet re-enroll    | `useEnsureDefaultPush` (AppShell)                                  |
| Permission CTA     | `src/features/notifications/components/push-enrollment-banner.tsx` |
| Settings toggle    | `src/features/notifications/components/push-alerts-section.tsx`    |
| Subscribe pipeline | `src/lib/push/client-subscribe.ts`                                 |
| Browser helpers    | `src/lib/push/browser.ts`, `preference.ts`                         |
| Service worker     | `worker/index.ts` → bundled `/sw.js`                               |
| Alerts sheet       | `src/features/notifications/components/notifications-sheet.tsx`    |
| Realtime + chime   | `useNotificationAlerts`                                            |
| Demo send          | `src/features/team/components/demo-mode-section.tsx`               |

Auth for Cron: `Authorization: Bearer $CRON_SECRET` or `x-cron-secret`.
All six functions pin `verify_jwt = false` in `supabase/config.toml` so
pg_cron / Dashboard Cron are not rejected by the JWT gateway.

---

## Push enrollment

1. **Quiet sync** — AppShell mounts `useEnsureDefaultPush`. If OS permission is
   already `granted` and the user has not opted out,
   `syncPushIfAlreadyGranted` re-saves the subscription (heals after a DB wipe
   of `push_subscriptions`).
2. **Banner / Settings tap** — `enrollPushSubscription` (iOS requires a direct
   gesture) → `Notification.requestPermission` → register `/sw.js` →
   `PushManager.subscribe(VAPID)` → `savePushSubscriptionAction`.
3. **Opt-out** — clears browser subscription + server row + local preference.

Foreground open app: Realtime toast + chime (no duplicate OS banner by design
when the SW still shows — iOS requires a visible notification per push).

---

## Schedule readiness checklist

| Item                                                                     | State                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------ |
| `CRON_SECRET` in Supabase secrets, Vercel (prod + preview), `.env.local` | Wired                                            |
| `APP_URL` → `https://crease-app-flagship.vercel.app` (Supabase secrets)  | Wired                                            |
| `verify_jwt = false` for all six Cron functions                          | Pinned in `config.toml`                          |
| `pg_cron.job` rows                                                       | **Empty** — none scheduled                       |
| `teams.whatsapp_notify_url`                                              | Null on seeded team until Settings configures it |
| `strength-reminders` → Web Push                                          | **Missing** `dispatchAppWebPush`                 |
| Frozen-poll edit re-notify                                               | **Incomplete**                                   |

Rotating `CRON_SECRET` means updating Supabase secrets and Vercel together,
then redeploying the app so `/api/internal/push` picks up the new value.

---

## Update convention

When a trigger ships, a gap closes, or Cron is enabled:

1. Update the status tables in this file.
2. Adjust `PENDING.md` Cron checklist.
3. Keep `.cursor/rules/22-notifications.mdc` aligned if product intent changes.
