# Feature: Payments & Settlement

Sunday **19:00 IST** Cron (`weekend-settlement`) generates weekend fees for
**completed** matches with a **finalized playing squad** and **saved carpool
assignment**. Cancelled matches are skipped. It may include Saturday only,
Sunday only, or both.

The Cron sends exactly **one** in-app payment notification to charged players
and individual WhatsApp messages (profile phones). `notified_at` makes retries
idempotent. Manual generation recalculates charges silently.

Per squad member (from post-match rides, not poll votes):

- Match fee share (`matchFees ÷ squad size`)
- \+ ₹100 if passenger
- Driver credit ₹100 × passenger count
- Weekend netting offsets credits against dues; leftover credit →
  `settlement_reimbursements` for Admin offline payout (UTR + screenshot)

If Sunday’s match is not completed yet at 19:00, only Saturday may bill — Admin can regenerate from `/payments` after both days complete.

Players:

1. Pay via UPI deeplink from `/payments` (team VPA from Settings + due amount),
   or pay manually in any UPI app
2. Submit UTR
3. Upload compressed screenshot (`payment-proofs`)
4. Mark paid

Admin:

- Assign carpool after kickoff, then complete or cancel the match
- Generate settlement manually from `/payments` (same eligibility)
- Mark offline paid
- Record driver reimbursements with UTR + screenshot
- Confirm settled when no pending charges or reimbursements
- Re-runs preserve paid / offline_paid / waived rows and drop pending orphans

There are no recurring unpaid notifications in MVP; dues remain visible in the
Payments screen until settled.
