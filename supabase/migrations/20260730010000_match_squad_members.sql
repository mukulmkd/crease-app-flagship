-- Playing squad distinct from availability pool.
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS squad_finalized_at timestamptz;

CREATE TABLE IF NOT EXISTS public.match_squad_members (
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, user_id)
);

CREATE INDEX IF NOT EXISTS match_squad_members_user_id_idx
  ON public.match_squad_members (user_id);

ALTER TABLE public.match_squad_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY match_squad_members_select_member
  ON public.match_squad_members FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_squad_members.match_id
        AND public.app_is_active_member(m.team_id)
    )
  );

CREATE POLICY match_squad_members_insert_admin
  ON public.match_squad_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND public.app_is_team_admin(m.team_id)
    )
  );

CREATE POLICY match_squad_members_delete_admin
  ON public.match_squad_members FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_squad_members.match_id
        AND public.app_is_team_admin(m.team_id)
    )
  );
