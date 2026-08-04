-- Mark when a match's weekend fees are fully settled (Confirm settled).
-- Used to decrement remaining tournament match count and archive tournaments.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS fees_settled_at timestamptz;

COMMENT ON COLUMN public.matches.fees_settled_at IS
  'Set when the weekend settlement containing this match is confirmed settled.';

CREATE INDEX IF NOT EXISTS matches_fees_settled_at_idx
  ON public.matches (tournament_id, fees_settled_at)
  WHERE tournament_id IS NOT NULL;
