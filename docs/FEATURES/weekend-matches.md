# Feature: Weekend Matches

Admin creates Saturday and/or Sunday matches for Ranches Thunders — **this weekend or any future weekend**.

## Create

- Weekend picker: this weekend, next weekend, or later (up to ~8 weeks)
- Day: Sat, Sun, or both (**separate independent field sets** — never shared opposition/time/fees)
- One match maximum per team/day. Existing days are disabled; an unused Sat
  or Sun remains available independently.
- Database uniqueness on `(team_id, match_date)` prevents concurrent duplicate
  creation; service validation returns a clear conflict first.
- Type: warmup | tournament (per day)
- Tournament: select or create (bottom sheet: name, # matches, total fees)
- Opposition, Google Maps URL, time (6:30 / 9:30 AM), match fees — TBD OK
- **Enable polls** flag per day — default **on** for this weekend, **off** for future weekends
- UI: `WeekendDaySection` + `CreateTournamentSheet`; sticky Create CTA

## Confirm

- Draft polls always created on match create
- Confirm publishes the fixture
- If `polls_enabled`: activates polls + notifies squad
- If not: fixture is live but polls stay draft until Admin taps **Enable polls now**
- Admin may vote as a player once polls are on
- Match detail uses a clubhouse fixture poster (`#0A0C0B`) before poll controls

## Home

- **This weekend** — fixtures for the current/upcoming Sat–Sun
- **More upcoming matches** — later weekends
- Tickets show `Polls on` / `Polls off`; voting only when confirmed + polls enabled

## Freeze

- Availability: match day − 1 (or Admin early freeze)
- Carpool: until kickoff
- Admin can still edit; edits re-notify

## Past matches (read-only report)

Past fixtures open a report card instead of live poll controls:

- Final squad strip (played / carpool / own)
- Who played roster
- Tournament block when classification is tournament
- My payment card (match share + carpool) with UTR / screenshot when present
- Admin fee rollup for every charged player + weekend settlement status
- Timeline: confirmed → kickoff → freeze → fees notified → settled

Still deferred: exact “Match N of M” tournament index, Admin-override badges
(no vote override flag in schema yet).

See also: [match-polls.md](./match-polls.md), [payments.md](./payments.md)
