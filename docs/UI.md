# UI Guidelines (MVP)

## Philosophy

- Mobile-first installable PWA that feels like a native iOS/Android utility app
- Strict **Stitch Athletic Precision** fidelity (project `5487252279778690236`)
- Professional, high-contrast, large touch targets (≥ 48px)
- Tonal elevation — avoid heavy shadows

## Design source

Canonical DS: Athletic Precision **ROUND_EIGHT**  
Asset: `assets/6d86c10d6d484fecb655a86c604b00bc`

Tokens: `src/styles/globals.css`, `src/constants/design-tokens.ts`

Do **not** copy Stitch HTML — rebuild with `src/components`.

## Roles in UI

Only **Admin** and **Player** actions. Hide management chrome from players.

## Key surfaces

| Surface       | Notes                                    |
| ------------- | ---------------------------------------- |
| Auth / OTP    | Native-feeling full-screen               |
| Access denied | Clear when not on squad                  |
| Home          | Weekend command center widgets           |
| Create match  | Form + tournament bottom sheet           |
| Polls         | One-tap availability + carpool           |
| Pay           | UPI instructions, UTR, screenshot upload |
| Team fund     | Balance + expense list (Admin)           |

## Navigation

- Mobile: bottom nav
- Desktop: sidebar
- Light + dark supported

## Stitch audit notes

See prior Home/shell pass: brand lockup, tonal active nav, hero next-up cards. Still open: FAB, M3 filled inputs, filter chips, 56px dense rows.
