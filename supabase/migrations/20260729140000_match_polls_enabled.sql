-- Polls open flag: when false, confirm keeps polls in draft until Admin enables.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS polls_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.matches.polls_enabled IS
  'When true, confirming the match activates availability + carpool polls. Defaults on for this weekend; often off for future weekends.';
