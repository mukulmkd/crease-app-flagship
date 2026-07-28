-- MVP identity: profiles, teams, memberships (admin | player only)
-- Seed: Ranches Thunders

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.membership_role AS ENUM ('admin', 'player');

CREATE TYPE public.membership_status AS ENUM (
  'active',
  'invited',
  'suspended',
  'left'
);

CREATE TYPE public.audit_action AS ENUM (
  'create',
  'update',
  'soft_delete',
  'restore',
  'status_change',
  'role_change'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  profile_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  upi_vpa text,
  whatsapp_notify_url text,
  carpool_fee_inr numeric(12, 2) NOT NULL DEFAULT 100 CHECK (carpool_fee_inr >= 0),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.membership_role NOT NULL DEFAULT 'player',
  status public.membership_status NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE INDEX team_memberships_user_id_idx ON public.team_memberships (user_id);
CREATE INDEX team_memberships_team_status_idx
  ON public.team_memberships (team_id, status);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams (id) ON DELETE SET NULL,
  actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  action public.audit_action NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_team_created_idx ON public.audit_logs (team_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER teams_set_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER team_memberships_set_updated_at
  BEFORE UPDATE ON public.team_memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, full_name)
  VALUES (
    NEW.id,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.app_is_active_member(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_memberships m
    WHERE m.team_id = p_team_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.app_is_team_admin(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_memberships m
    WHERE m.team_id = p_team_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.app_is_any_active_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_memberships m
    WHERE m.user_id = auth.uid()
      AND m.status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_self_or_teammate
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.team_memberships me
      JOIN public.team_memberships other
        ON other.team_id = me.team_id
       AND other.status = 'active'
      WHERE me.user_id = auth.uid()
        AND me.status = 'active'
        AND other.user_id = profiles.id
    )
  );

CREATE POLICY profiles_update_self
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY teams_select_member
  ON public.teams FOR SELECT TO authenticated
  USING (public.app_is_active_member(id));

CREATE POLICY teams_update_admin
  ON public.teams FOR UPDATE TO authenticated
  USING (public.app_is_team_admin(id))
  WITH CHECK (public.app_is_team_admin(id));

CREATE POLICY memberships_select_member
  ON public.team_memberships FOR SELECT TO authenticated
  USING (public.app_is_active_member(team_id) OR user_id = auth.uid());

CREATE POLICY memberships_insert_admin
  ON public.team_memberships FOR INSERT TO authenticated
  WITH CHECK (public.app_is_team_admin(team_id));

CREATE POLICY memberships_update_admin
  ON public.team_memberships FOR UPDATE TO authenticated
  USING (public.app_is_team_admin(team_id))
  WITH CHECK (public.app_is_team_admin(team_id));

CREATE POLICY audit_select_admin
  ON public.audit_logs FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.app_is_team_admin(team_id));

CREATE POLICY audit_insert_member
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (team_id IS NULL OR public.app_is_active_member(team_id))
  );

-- ---------------------------------------------------------------------------
-- Seed Ranches Thunders
-- ---------------------------------------------------------------------------

INSERT INTO public.teams (id, name, slug, carpool_fee_inr)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Ranches Thunders',
  'ranches-thunders',
  100
)
ON CONFLICT (slug) DO NOTHING;
