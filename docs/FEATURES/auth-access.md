# Feature: Auth & Access

- Mobile OTP (+ dummy OTP in local/dev and optional Vercel demo via `AUTH_DEV_FIXED_OTP`)
- **Invite-only**: `shouldCreateUser: false` — Admin must add the player before OTP works
- After OTP, active Ranches Thunders membership is required or session is cleared
- Middleware redirects non-members to `/access-denied`
- KMSI until sign-out
- Mandatory first-login profile: **full name** + **mobile (+91, 10 digits)** matching the OTP number

## Gate order

1. Not authenticated → `/login`
2. Authenticated, not active member → `/access-denied`
3. Active member, incomplete profile → `/complete-profile`
4. Else → `/home`

## UI (Modern Scorebook Utility)

- `AuthShell` + official C-hand-and-ball app icon
- Login: Oswald headline, Plus Jakarta Sans body, +91 field, members-only trust panel
- Complete profile: name + +91 mobile (both required)
- Access denied: invite-only copy + sign out
- OTP: large cells, resend timer, demo OTP strip when `NEXT_PUBLIC_AUTH_DEV_OTP` is set
- Never ship decorative gradients or generic SaaS login chrome
- **Profile** (`/profile`): avatar upload/replace/remove, role chip, edit full
  name, read-only phone, sign out. Replacing a photo deletes the previous
  object in the public `avatars` bucket.
- Top profile menu uses live membership role + profile name + avatar
