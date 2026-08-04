# Feature: Notifications

Channels: in-app alerts sheet + Web Push (OS) + WhatsApp webhook.

## UI

- Top-right **bell** opens an alerts **bottom sheet** (mark-read)
- Unread badge via `useUnreadNotificationCount`
- Home “Recent alerts” teaser opens the same sheet
- Web Push deep-link: `/home?alerts=1`
- Push enable/disable: Settings → Push alerts

## Triggers (implemented)

| When                            | What                                                      |
| ------------------------------- | --------------------------------------------------------- |
| Match confirmed                 | Vote CTA to all members + WhatsApp                        |
| Availability yes→no             | Spot-opened notify                                        |
| Each pre-freeze 13th+ yes       | Admin-only intervention alert                             |
| Freeze (Cron 18:00 IST / Admin) | Finalize at 11–12; invalid strength waits for Admin       |
| Admin confirms 11–12            | Squad notification + WhatsApp                             |
| Strength Cron 12:00 & 21:00 IST | Remind non-voters if yes &lt; 11 (in-app + individual WA) |
| Match day 14:00 IST             | Admin-only carpool assignment reminder                    |
| Weekend settlement Sun 19:00    | One payment notification per weekend                      |
| Fund ask                        | ₹300 contribution request                                 |

## Fan-out

RLS only allows Admin inserts on `notifications` (and self-reads), so app-triggered
team fan-out runs through `broadcastTeamNotificationAction` — a Server Action that
re-checks membership, then batch-inserts one row per active member with the service
role. Player-triggered events (availability flip) work because of this.

- One batched insert per broadcast, never one round trip per member
- Voter is excluded via `excludeUserId`
- Admin-only broadcasts pass `adminOnly: true`
- WhatsApp payload: `{ text }` for group; `{ text, phones }` for individuals
- Web Push after insert (non-blocking); Cron uses `APP_URL` → `/api/internal/push`
- Delivery failures are logged and never fail the triggering mutation
- Cron Edge Functions insert directly with the service role
