-- Who prepaid tournament entry fees (Admin), and per-charge tournament credit
-- so their share is netted / reimbursed with proof like driver credits.

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS fees_paid_by_user_id uuid
    REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.tournaments.fees_paid_by_user_id IS
  'Admin who prepaid total tournament entry fees; credited per match on settlement.';

CREATE INDEX IF NOT EXISTS tournaments_fees_paid_by_user_id_idx
  ON public.tournaments (fees_paid_by_user_id)
  WHERE fees_paid_by_user_id IS NOT NULL;

ALTER TABLE public.settlement_charges
  ADD COLUMN IF NOT EXISTS tournament_credit_inr numeric(12, 2) NOT NULL DEFAULT 0
    CHECK (tournament_credit_inr >= 0);

COMMENT ON COLUMN public.settlement_charges.tournament_credit_inr IS
  'Prepaid tournament entry pool for this match, credited to fees_paid_by Admin.';
