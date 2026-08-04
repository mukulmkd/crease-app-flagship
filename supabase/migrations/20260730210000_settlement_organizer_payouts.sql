-- Organizer payouts: Admin pays match fees onward to tournament/ground organizers.
-- One shared weekend payout (match_id null) OR one payout per match.

ALTER TABLE public.weekend_settlements
  ADD COLUMN IF NOT EXISTS organizer_payout_reminded_at timestamptz;

CREATE TABLE IF NOT EXISTS public.settlement_organizer_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid NOT NULL REFERENCES public.weekend_settlements (id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  -- NULL = singular organizer for the whole weekend
  match_id uuid REFERENCES public.matches (id) ON DELETE CASCADE,
  payee_name text,
  amount_inr numeric(12, 2) NOT NULL CHECK (amount_inr > 0),
  status public.reimbursement_status NOT NULL DEFAULT 'pending',
  utr text,
  screenshot_path text,
  paid_at timestamptz,
  marked_paid_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS settlement_organizer_payouts_shared_uidx
  ON public.settlement_organizer_payouts (settlement_id)
  WHERE match_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS settlement_organizer_payouts_match_uidx
  ON public.settlement_organizer_payouts (settlement_id, match_id)
  WHERE match_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS settlement_organizer_payouts_status_idx
  ON public.settlement_organizer_payouts (team_id, status);

DROP TRIGGER IF EXISTS settlement_organizer_payouts_set_updated_at
  ON public.settlement_organizer_payouts;
CREATE TRIGGER settlement_organizer_payouts_set_updated_at
  BEFORE UPDATE ON public.settlement_organizer_payouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.settlement_organizer_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS settlement_organizer_payouts_select_member
  ON public.settlement_organizer_payouts;
CREATE POLICY settlement_organizer_payouts_select_member
  ON public.settlement_organizer_payouts FOR SELECT TO authenticated
  USING (public.app_is_active_member(team_id));

DROP POLICY IF EXISTS settlement_organizer_payouts_write_admin
  ON public.settlement_organizer_payouts;
CREATE POLICY settlement_organizer_payouts_write_admin
  ON public.settlement_organizer_payouts FOR ALL TO authenticated
  USING (public.app_is_team_admin(team_id))
  WITH CHECK (public.app_is_team_admin(team_id));
