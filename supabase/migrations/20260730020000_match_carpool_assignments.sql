-- Post-match carpool rides (drivers / passengers) and driver reimbursements.

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS carpool_assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS carpool_assignment_reminded_at timestamptz;

CREATE TABLE IF NOT EXISTS public.match_carpool_rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  driver_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, driver_user_id)
);

CREATE INDEX IF NOT EXISTS match_carpool_rides_match_id_idx
  ON public.match_carpool_rides (match_id);

CREATE TABLE IF NOT EXISTS public.match_carpool_passengers (
  ride_id uuid NOT NULL REFERENCES public.match_carpool_rides (id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  passenger_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ride_id, passenger_user_id),
  UNIQUE (match_id, passenger_user_id)
);

CREATE INDEX IF NOT EXISTS match_carpool_passengers_passenger_idx
  ON public.match_carpool_passengers (passenger_user_id);

ALTER TABLE public.settlement_charges
  ADD COLUMN IF NOT EXISTS carpool_credit_inr numeric(12, 2) NOT NULL DEFAULT 0
    CHECK (carpool_credit_inr >= 0);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'reimbursement_status'
  ) THEN
    CREATE TYPE public.reimbursement_status AS ENUM (
      'pending',
      'paid',
      'offline_paid'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.settlement_reimbursements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid NOT NULL REFERENCES public.weekend_settlements (id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  amount_inr numeric(12, 2) NOT NULL CHECK (amount_inr > 0),
  status public.reimbursement_status NOT NULL DEFAULT 'pending',
  utr text,
  screenshot_path text,
  paid_at timestamptz,
  marked_paid_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (settlement_id, user_id)
);

CREATE INDEX IF NOT EXISTS settlement_reimbursements_status_idx
  ON public.settlement_reimbursements (team_id, status);

DROP TRIGGER IF EXISTS settlement_reimbursements_set_updated_at
  ON public.settlement_reimbursements;
CREATE TRIGGER settlement_reimbursements_set_updated_at
  BEFORE UPDATE ON public.settlement_reimbursements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.match_carpool_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_carpool_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_reimbursements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS match_carpool_rides_select_member ON public.match_carpool_rides;
CREATE POLICY match_carpool_rides_select_member
  ON public.match_carpool_rides FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_carpool_rides.match_id
        AND public.app_is_active_member(m.team_id)
    )
  );

DROP POLICY IF EXISTS match_carpool_rides_write_admin ON public.match_carpool_rides;
CREATE POLICY match_carpool_rides_write_admin
  ON public.match_carpool_rides FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_carpool_rides.match_id
        AND public.app_is_team_admin(m.team_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND public.app_is_team_admin(m.team_id)
    )
  );

DROP POLICY IF EXISTS match_carpool_passengers_select_member ON public.match_carpool_passengers;
CREATE POLICY match_carpool_passengers_select_member
  ON public.match_carpool_passengers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_carpool_passengers.match_id
        AND public.app_is_active_member(m.team_id)
    )
  );

DROP POLICY IF EXISTS match_carpool_passengers_write_admin ON public.match_carpool_passengers;
CREATE POLICY match_carpool_passengers_write_admin
  ON public.match_carpool_passengers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_carpool_passengers.match_id
        AND public.app_is_team_admin(m.team_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND public.app_is_team_admin(m.team_id)
    )
  );

DROP POLICY IF EXISTS reimbursements_select_member ON public.settlement_reimbursements;
CREATE POLICY reimbursements_select_member
  ON public.settlement_reimbursements FOR SELECT TO authenticated
  USING (public.app_is_active_member(team_id));

DROP POLICY IF EXISTS reimbursements_write_admin ON public.settlement_reimbursements;
CREATE POLICY reimbursements_write_admin
  ON public.settlement_reimbursements FOR ALL TO authenticated
  USING (public.app_is_team_admin(team_id))
  WITH CHECK (public.app_is_team_admin(team_id));
