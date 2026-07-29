-- Marks that a freeze was attempted without enough available players.
-- Voting remains open until Admin recruits and confirms a playing 11–12.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS squad_finalization_pending_at timestamptz;
