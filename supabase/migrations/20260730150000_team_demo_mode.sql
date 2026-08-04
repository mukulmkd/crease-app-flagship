-- Demo mode: smaller playing squad (4) + Admin past-weekend fixtures for E2E QA.
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS demo_mode boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.teams.demo_mode IS
  'When true, playing squad target is 4 and Admin may create past weekend matches for payment E2E testing.';
