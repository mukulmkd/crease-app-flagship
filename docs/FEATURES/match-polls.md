# Feature: Match Polls

Each confirmed match has:

1. Availability poll (available / not — open pool, no hard yes-cap)
2. Carpool poll (carpool vs own travel — **intent only**; fees use post-match assignment)

## Playing squad

- Stored in `match_squad_members` when `matches.squad_finalized_at` is set
- Soft target 11–12 selected players (fees use this set only)
- At freeze (Cron MD−1 18:00 IST or Admin):
  - **11–12** yes → auto-finalize + in-app + WhatsApp
  - **> 12** yes → Admin multi-select finalize (`MatchSquadFinalize`)
  - **< 11** yes → voting stays open; Admin is alerted to recruit players
  - After a short freeze attempt, Admin explicitly confirms 11–12; only then
    does the squad lock and notify
- Before freeze, every 13th+ yes vote sends an Admin-only intervention alert
- An oversubscribed Cron freeze is silent and waits for Admin confirmation
- Unfreeze clears the finalized squad

## Post-match carpool

- After kickoff, Admin assigns drivers + passengers (`MatchCarpoolAssign`)
- Passenger ₹100 / driver ₹100 credit per passenger
- Match day **14:00 IST** Cron reminds Admins
- Admin then marks **completed** or **cancelled** (no Cron auto-complete)

## Rules

- Visible roster of who is available / selected (`MatchPollPanel`)
- **`polls_enabled`** on each match — polls activate on confirm only when this flag is on
- Default: on for this weekend, off for future weekends; Admin can enable later from match detail
- **Availability** freezes on match day − 1 (Cron 18:00 IST) or earlier when Admin locks
- Admin may **unfreeze availability** before kickoff to reopen player voting
- **Carpool** stays open until match kickoff (IST)
- After each poll freezes: Admin override only (`MATCH_POLL_OVERRIDE`)
- Cron `freeze-polls`:
  - freezes availability for tomorrow’s matches (+ auto-squad when 11–12)
  - freezes carpool after kickoff (does **not** mark completed)
- Strength reminders **12:00** & **21:00 IST** while yes &lt; 11 and availability not frozen
- Yes → no flip re-notifies squad

## UI (Modern Cricket Club)

- One-tap `SegmentedControl` (lime active)
- Live available count / finalized squad on match detail + Home tickets
- Home tickets provide real one-tap availability and travel voting per match
- Availability and travel disable independently when each poll freezes
- A dedicated arrow opens match detail for roster and Admin operations
