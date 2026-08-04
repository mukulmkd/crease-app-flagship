-- Payment collector: exactly one Admin collects weekend fees via team UPI VPA.
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS collector_user_id uuid
    REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.teams.collector_user_id IS
  'Active Admin who collects weekend UPI payments. Team upi_vpa is their VPA.';

CREATE INDEX IF NOT EXISTS teams_collector_user_id_idx
  ON public.teams (collector_user_id)
  WHERE collector_user_id IS NOT NULL;

-- Optional note on charges (e.g. "Collector so auto settled").
ALTER TABLE public.settlement_charges
  ADD COLUMN IF NOT EXISTS note text;

COMMENT ON COLUMN public.settlement_charges.note IS
  'Optional settlement note, e.g. collector auto-settle reason.';
