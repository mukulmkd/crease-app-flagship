-- A team can schedule at most one match on a calendar day.
-- This is the race-safe backstop for the service/UI duplicate checks.
ALTER TABLE public.matches
  ADD CONSTRAINT matches_team_match_date_unique
  UNIQUE (team_id, match_date);
