# Feature: Notifications

Channels: in-app inbox + WhatsApp webhook (group and/or individual via `phones`).
Web Push deferred.

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
- Delivery failures are logged and never fail the triggering mutation
- Cron Edge Functions insert directly with the service role

## UI

- `/notifications` inbox with mark-read
- TopAppBar unread badge via `useUnreadNotificationCount`
- Home recent alert teaser from dashboard snapshot
