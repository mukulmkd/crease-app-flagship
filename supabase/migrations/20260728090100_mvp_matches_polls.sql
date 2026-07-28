-- MVP matches, tournaments, polls

CREATE TYPE public.match_classification AS ENUM ('warmup', 'tournament');

CREATE TYPE public.match_status AS ENUM (
  'draft',
  'pending_confirm',
  'confirmed',
  'completed',
  'cancelled'
);

CREATE TYPE public.tournament_status AS ENUM (
  'draft',
  'active',
  'completed',
  'cancelled'
);

CREATE TYPE public.poll_type AS ENUM ('availability', 'carpool');

CREATE TYPE public.poll_status AS ENUM (
  'draft',
  'active',
  'frozen',
  'closed'
);

CREATE TYPE public.availability_vote AS ENUM ('yes', 'no');

CREATE TYPE public.carpool_vote AS ENUM ('carpool', 'self');

CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  name text NOT NULL,
  planned_match_count integer NOT NULL CHECK (planned_match_count > 0),
  total_fees_inr numeric(12, 2) NOT NULL CHECK (total_fees_inr >= 0),
  status public.tournament_status NOT NULL DEFAULT 'active',
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tournaments_team_idx ON public.tournaments (team_id);

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  match_date date NOT NULL,
  classification public.match_classification NOT NULL DEFAULT 'warmup',
  tournament_id uuid REFERENCES public.tournaments (id) ON DELETE SET NULL,
  opposition text,
  ground_maps_url text,
  start_time time,
  match_fees_inr numeric(12, 2) CHECK (match_fees_inr IS NULL OR match_fees_inr >= 0),
  status public.match_status NOT NULL DEFAULT 'draft',
  polls_frozen boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT matches_weekend_day_chk CHECK (
    EXTRACT(ISODOW FROM match_date) IN (6, 7)
  ),
  CONSTRAINT matches_tournament_required_chk CHECK (
    (classification = 'warmup' AND tournament_id IS NULL)
    OR (classification = 'tournament')
  )
);

CREATE INDEX matches_team_date_idx ON public.matches (team_id, match_date DESC);
CREATE INDEX matches_tournament_idx ON public.matches (tournament_id);

CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  type public.poll_type NOT NULL,
  status public.poll_status NOT NULL DEFAULT 'draft',
  frozen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, type)
);

CREATE INDEX polls_team_match_idx ON public.polls (team_id, match_id);

CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  availability public.availability_vote,
  carpool public.carpool_vote,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id),
  CONSTRAINT poll_votes_choice_chk CHECK (
    (availability IS NOT NULL AND carpool IS NULL)
    OR (availability IS NULL AND carpool IS NOT NULL)
  )
);

CREATE INDEX poll_votes_user_idx ON public.poll_votes (user_id);

CREATE TRIGGER tournaments_set_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER matches_set_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER polls_set_updated_at
  BEFORE UPDATE ON public.polls
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER poll_votes_set_updated_at
  BEFORE UPDATE ON public.poll_votes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY tournaments_select_member
  ON public.tournaments FOR SELECT TO authenticated
  USING (public.app_is_active_member(team_id));

CREATE POLICY tournaments_write_admin
  ON public.tournaments FOR ALL TO authenticated
  USING (public.app_is_team_admin(team_id))
  WITH CHECK (public.app_is_team_admin(team_id));

CREATE POLICY matches_select_member
  ON public.matches FOR SELECT TO authenticated
  USING (public.app_is_active_member(team_id));

CREATE POLICY matches_write_admin
  ON public.matches FOR ALL TO authenticated
  USING (public.app_is_team_admin(team_id))
  WITH CHECK (public.app_is_team_admin(team_id));

CREATE POLICY polls_select_member
  ON public.polls FOR SELECT TO authenticated
  USING (public.app_is_active_member(team_id));

CREATE POLICY polls_write_admin
  ON public.polls FOR ALL TO authenticated
  USING (public.app_is_team_admin(team_id))
  WITH CHECK (public.app_is_team_admin(team_id));

CREATE POLICY poll_votes_select_member
  ON public.poll_votes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_votes.poll_id
        AND public.app_is_active_member(p.team_id)
    )
  );

CREATE POLICY poll_votes_upsert_self
  ON public.poll_votes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_id
        AND public.app_is_active_member(p.team_id)
        AND p.status = 'active'
    )
  );

CREATE POLICY poll_votes_update_self_or_admin
  ON public.poll_votes FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_votes.poll_id
        AND public.app_is_active_member(p.team_id)
        AND (
          (poll_votes.user_id = auth.uid() AND p.status = 'active')
          OR public.app_is_team_admin(p.team_id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_id
        AND public.app_is_active_member(p.team_id)
        AND (
          (user_id = auth.uid() AND p.status IN ('active', 'frozen'))
          OR public.app_is_team_admin(p.team_id)
        )
    )
  );
