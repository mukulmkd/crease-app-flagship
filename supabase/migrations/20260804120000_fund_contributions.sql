-- Per-player team fund contributions (Admin-recorded offline payments).

CREATE TABLE public.fund_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  amount_inr numeric(12, 2) NOT NULL CHECK (amount_inr > 0),
  ask_id uuid REFERENCES public.fund_contribution_asks (id) ON DELETE SET NULL,
  note text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX fund_contributions_team_user_idx
  ON public.fund_contributions (team_id, user_id);

CREATE INDEX fund_contributions_team_created_idx
  ON public.fund_contributions (team_id, created_at DESC);

ALTER TABLE public.team_fund_transactions
  ADD COLUMN contribution_id uuid REFERENCES public.fund_contributions (id) ON DELETE SET NULL;

CREATE TRIGGER fund_contributions_set_updated_at
  BEFORE UPDATE ON public.fund_contributions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.fund_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY fund_contributions_select_member
  ON public.fund_contributions FOR SELECT TO authenticated
  USING (public.app_is_active_member(team_id));

CREATE POLICY fund_contributions_write_admin
  ON public.fund_contributions FOR ALL TO authenticated
  USING (public.app_is_team_admin(team_id))
  WITH CHECK (public.app_is_team_admin(team_id));
