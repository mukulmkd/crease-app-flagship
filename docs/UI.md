# UI Guidelines (MVP)

## Philosophy

- Mobile-first installable PWA that feels like a native iOS/Android utility app
- Strict **Stitch Modern Cricket Club** fidelity (project `5487252279778690236`)
- Scorebook × sports utility — not a generic SaaS dashboard
- Professional hierarchy, large touch targets (≥ 48px)
- Tonal elevation — avoid heavy shadows and nested cards

## Design source

| Field         | Value                          |
| ------------- | ------------------------------ |
| Project       | Crease Cricket Team Management |
| Project ID    | `5487252279778690236`          |
| Design system | **Modern Cricket Club**        |
| Asset         | `assets/11807811405223687109`  |
| Roundness     | `ROUND_EIGHT` (8px default)    |

Tokens (keep both in sync):

- `src/styles/globals.css`
- `src/constants/design-tokens.ts`

Fonts (loaded in `src/app/layout.tsx`):

- **Barlow Condensed** → `--font-heading` / `font-heading` (display, scores, dates, fees)
- **Manrope** → `--font-sans` (body, labels, forms, nav)

Do **not** copy Stitch HTML — rebuild with `src/components` and feature UI.

## Palette

| Role          | Hex       | Notes                           |
| ------------- | --------- | ------------------------------- |
| Canvas        | `#F5F2E8` | Warm scorecard ivory            |
| Primary       | `#0B5D2A` | Pitch green CTAs / brand        |
| Clubhouse     | `#082417` | Match tickets / fixture posters |
| Accent (lime) | `#C9F64B` | Selected / positive **only**    |
| Urgency       | `#C83E35` | Unpaid / destructive / critical |
| Ink           | `#151A17` | Primary text                    |

## Signature patterns

1. **Match ticket** — next fixture as a dominant dark surface (`MatchTicket`), not a small grid card.
2. **SegmentedControl** — one-tap availability, carpool, warmup/tournament, start time; lime active state.
3. **Bottom sheets** — create tournament, add player, confirm, pay.
4. **Status rail** — compact Home metrics (carpool / unpaid / fund).
5. **Admin chips** — secondary quick actions; never compete with the next match.

## Roles in UI

Only **Admin** and **Player** actions. Hide management chrome from players. Services still authorize.

## Key surfaces

| Surface       | Notes                                                        |
| ------------- | ------------------------------------------------------------ |
| Auth / OTP    | Brand-forward login; demo OTP strip when enabled             |
| Access denied | Clear when not on squad                                      |
| Home          | One match ticket per weekend day + status rail + admin chips |
| Create match  | Independent Sat/Sun sections + tournament sheet              |
| Match detail  | Clubhouse fixture poster + confirm / vote area               |
| Team          | Dense roster rows + add-player sheet                         |
| Polls         | One-tap availability + carpool (when hooks land)             |
| Pay           | UPI, UTR, screenshot upload                                  |
| Team fund     | Balance + expense list (Admin)                               |

## Navigation

- Mobile: bottom nav only (lime active pill); no hamburger drawer. Home,
  Matches, Team, Payments, and Profile are always present; Settings is
  Admin-only. Alerts use the persistent top-bar bell.
- Desktop: sidebar
- Light + dark supported (light is canonical MCC canvas)

## Agent checklist for UI changes

1. Confirm Stitch Modern Cricket Club (not Athletic Precision).
2. Reuse typography / `SegmentedControl` / `BottomSheet` / `MatchTicket` before inventing.
3. Sync CSS vars and `design-tokens.ts` together.
4. Keep lime reserved for selection/confirmation accents.
5. Prefer feature files under ~250 lines.
6. Update this doc / `.cursor/rules/12-stitch-design-system.mdc` if patterns change.
