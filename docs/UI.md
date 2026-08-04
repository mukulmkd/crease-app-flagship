# UI Guidelines (MVP)

## Philosophy

- Mobile-first installable PWA that feels like a native iOS/Android utility app
- **Modern Scorebook Utility** — an original Crease design system
- Scorebook × sports utility — not a generic SaaS dashboard
- Professional hierarchy, large touch targets (≥ 48px)
- Tonal elevation — avoid heavy shadows and nested cards

## Design source

| Field         | Value                          |
| ------------- | ------------------------------ |
| Product       | Crease Cricket Team Management |
| Design system | **Modern Scorebook Utility**   |
| Source        | This document + shipped tokens |
| Roundness     | `ROUND_EIGHT` (8px default)    |

Tokens (keep both in sync):

- `src/styles/globals.css`
- `src/constants/design-tokens.ts`

Fonts (loaded in `src/app/layout.tsx`):

- **Oswald** → `--font-heading` / `font-heading` (display, scores, dates, fees)
- **Plus Jakarta Sans** → `--font-sans` (body, labels, forms, nav)

Do not import or regenerate an external design system. Build with shared Crease
components and feature UI.

## Locked direction (2026 UX overhaul)

Thesis: neutral stone canvas, **ink** primary, **amber** selection only.
No pitch green / lime anywhere. Dark = Neutral Night charcoal chrome.

| Decision     | Choice                                                    |
| ------------ | --------------------------------------------------------- |
| Display font | Oswald                                                    |
| UI font      | Plus Jakarta Sans                                         |
| Light canvas | Neutral stone `#F2F2F1`                                   |
| Primary      | Ink `#1A1A1A` (containers `#2E2E2E`)                      |
| Clubhouse    | Near-black `#0A0C0B` (both themes)                        |
| Accent       | Amber `#E0B84A` — selected / positive **only**            |
| Urgency      | `#C44B42`                                                 |
| Success      | Blue `#1A6BB5` / dark `#7EB6E0` (not green)               |
| Dark primary | Off-white ink `#EDEEEB` CTAs                              |
| Dark canvas  | Neutral Night `#0C0E0D`                                   |
| Brand mark   | Minimal C-shaped hand cradling a ball; team logo separate |

### Avoid

- Purple / indigo AI gradients
- Glassmorphism stacks
- Decorative cricket clipart
- **Any green / lime brand color** (pitch, lime, green-charcoal wash)
- Inter / Roboto as brand voice
- Amber painted on every surface (selection only)

## Palette

### Light

| Role           | Hex       | Notes                        |
| -------------- | --------- | ---------------------------- |
| Canvas         | `#F2F2F1` | Neutral stone scorebook      |
| Primary        | `#1A1A1A` | Ink CTAs / brand             |
| Clubhouse      | `#0A0C0B` | Match tickets / posters      |
| Accent (amber) | `#E0B84A` | Selected / positive **only** |
| Urgency        | `#C44B42` | Unpaid / destructive         |
| Success        | `#1A6BB5` | Confirmations (not green)    |
| Ink            | `#141414` | Primary text                 |

### Dark — Neutral Night

| Role           | Hex                   | Notes                     |
| -------------- | --------------------- | ------------------------- |
| Canvas         | `#0C0E0D`             | Neutral charcoal          |
| Surfaces       | `#161A18` → `#2A302D` | Cool gray steps           |
| Primary        | `#EDEEEB`             | Light ink CTAs            |
| Clubhouse      | `#0A0C0B`             | Near-black tickets        |
| Accent (amber) | `#E0B84A`             | Selection only            |
| Urgency        | `#E5736A`             | Softened destructive      |
| Success        | `#7EB6E0`             | Confirmations (not green) |
| Ink            | `#EDEEEB`             | Off-white                 |

## Signature patterns

1. **App identity** — a minimal amber C-shaped hand cradling an off-white
   cricket ball on clubhouse black. Use the same master for in-app branding,
   browser icon, Apple icon, and PWA icons; do not redraw it per size.
2. **Match ticket** — next fixture as a dominant dark surface (`MatchTicket`), not a small grid card.
3. **MatchPollControl** — shared compact/full availability and carpool voting.
4. **SegmentedControl** — exclusive choices with amber active state.
5. **ManageMatchSheet** — staged Admin lifecycle actions.
6. **Bottom sheets** — create, confirm, pay, and management tasks.
7. **Metric rail** — compact operational metrics, not equal-weight card grids.

## Roles in UI

Only **Admin** and **Player** actions. Hide management chrome from players. Services still authorize.

## Key surfaces

| Surface       | Notes                                                     |
| ------------- | --------------------------------------------------------- |
| Auth / OTP    | Brand-forward login; demo OTP strip when enabled          |
| Access denied | Clear when not on squad                                   |
| Home          | Match ticket → personal dues → alerts; Admin rail follows |
| Create match  | Independent Sat/Sun sections + tournament sheet           |
| Match detail  | Fixture poster + participation state + staged management  |
| Team          | Dense roster rows + add-player sheet                      |
| Polls         | One-tap availability + carpool                            |
| Pay           | UPI app rows, UTR, screenshot upload                      |
| Team fund     | Balance + expense list (Admin)                            |

## Navigation

- Mobile: exactly five bottom destinations — Home, Matches, Team, Pay, Profile.
  Fund and Settings live in the Profile hub; there is no hamburger drawer.
- Desktop: sidebar exposes primary destinations plus role-aware Fund / Settings.
- Alerts use the persistent top-bar bell and deep-link to the relevant task.
- Light + dark supported (light = stone + ink; dark = Neutral Night)

## UX overhaul status

**Frozen (approved):** Ink + Amber + Neutral Night. Do not reintroduce green/lime
or an external generated design system. Amber stays selection-only.

## Typography roles

- `Display` — route hero only; Oswald.
- `Headline` — major section / task title; Oswald.
- `Title` — page title; Oswald; one `h1` per route.
- `Stat` — scores, fees, counts, dates; Oswald with tabular numerals.
- `Label` — controls and field labels; Plus Jakarta Sans.
- `Overline` — short section label only; never long explanatory copy.
- `Caption` — supporting metadata; minimum 12px.
- `Body` / `BodySm` — operational and supporting copy.

## Layout and density

- 16px mobile page gutter; content uses a readable max width on larger screens.
- 8px is the default radius. Use larger radii only for sheets and hero surfaces.
- Default touch targets are 48px. Dense desktop-only exceptions may be 40px.
- Prefer one dominant surface and open tonal sections over nested cards.
- Use progressive disclosure for rules and Admin-only advanced actions.
- App chrome is solid and tonal; no backdrop blur or glass treatment.

## State requirements

Every data surface must define loading, empty, error, success, permission, and
offline behavior. Route-level skeletons/errors cover high-traffic routes.
Mutations disable or show loading on their initiating control and preserve user
input on recoverable failure.

## Accessibility

- One `h1` per route and semantic section headings.
- Labels, descriptions, and errors are programmatically associated.
- Exclusive controls support arrow-key radio navigation.
- All custom controls have visible focus and meaningful accessible names.
- Meet WCAG AA in both themes; do not use low-opacity microcopy on tickets.
- Respect reduced motion for CSS and programmatic scrolling.

## PWA behavior

- Browser theme color follows the resolved in-app theme.
- Bottom nav, push banner, toasts, sheets, safe areas, and soft keyboard share
  geometry tokens and never obscure content.
- Service-worker updates require user confirmation; never reload an active form.
- Offline UI explains limitations, offers retry, and returns to Home.
- Installed PWA must work in portrait and landscape where the OS supports it.

## Agent checklist for UI changes

1. Follow **Modern Scorebook Utility** tokens in this doc.
2. Reuse typography / `MatchPollControl` / `SegmentedControl` / `BottomSheet` / `MatchTicket`.
3. Sync CSS vars and `design-tokens.ts` together.
4. Keep amber reserved for selection/confirmation accents.
5. Never use green/lime for brand, CTAs, success, or chrome.
6. Prefer ≥ 48px touch targets; keep focus rings (`ring-ring` / `ring-primary`).
7. Prefer feature files under ~250 lines.
8. Update this doc / `.cursor/rules/12-design-system.mdc` if patterns change.
