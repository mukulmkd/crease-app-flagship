-- MVP finance, settlements, notifications, payment-proof storage

CREATE TYPE public.settlement_status AS ENUM (
  'open',
  'collecting',
  'settled',
  'cancelled'
);

CREATE TYPE public.charge_status AS ENUM (
  'pending',
  'paid',
  'offline_paid',
  'waived'
);

CREATE TYPE public.fund_txn_direction AS ENUM ('credit', 'debit');

CREATE TYPE public.contribution_ask_status AS ENUM (
  'draft',
  'sent',
  'closed'
);

CREATE TYPE public.notification_type AS ENUM (
  'match',
  'poll',
  'payment',
  'fund',
  'membership',
  'system'
);

CREATE TABLE public.weekend_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  status public.settlement_status NOT NULL DEFAULT 'open',
  notified_at timestamptz,
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, week_start_date)
);

CREATE TABLE public.settlement_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid NOT NULL REFERENCES public.weekend_settlements (id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  match_fee_share_inr numeric(12, 2) NOT NULL DEFAULT 0 CHECK (match_fee_share_inr >= 0),
  carpool_fee_inr numeric(12, 2) NOT NULL DEFAULT 0 CHECK (carpool_fee_inr >= 0),
  total_inr numeric(12, 2) NOT NULL CHECK (total_inr >= 0),
  status public.charge_status NOT NULL DEFAULT 'pending',
  utr text,
  screenshot_path text,
  paid_at timestamptz,
  marked_paid_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id)
);

CREATE INDEX settlement_charges_status_idx
  ON public.settlement_charges (team_id, status);

CREATE TABLE public.team_fund_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL UNIQUE REFERENCES public.teams (id) ON DELETE CASCADE,
  balance_inr numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  amount_inr numeric(12, 2) NOT NULL CHECK (amount_inr > 0),
  category text NOT NULL DEFAULT 'other',
  note text,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_fund_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.team_fund_accounts (id) ON DELETE CASCADE,
  direction public.fund_txn_direction NOT NULL,
  amount_inr numeric(12, 2) NOT NULL CHECK (amount_inr > 0),
  note text,
  expense_id uuid REFERENCES public.expenses (id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX team_fund_transactions_team_created_idx
  ON public.team_fund_transactions (team_id, created_at DESC);

CREATE TABLE public.fund_contribution_asks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  amount_per_player_inr numeric(12, 2) NOT NULL DEFAULT 300 CHECK (amount_per_player_inr > 0),
  note text,
  status public.contribution_ask_status NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE,
  type public.notification_type NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE TRIGGER weekend_settlements_set_updated_at
  BEFORE UPDATE ON public.weekend_settlements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER settlement_charges_set_updated_at
  BEFORE UPDATE ON public.settlement_charges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER team_fund_accounts_set_updated_at
  BEFORE UPDATE ON public.team_fund_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER expenses_set_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER fund_contribution_asks_set_updated_at
  BEFORE UPDATE ON public.fund_contribution_asks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.weekend_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_fund_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_contribution_asks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY settlements_select_member
  ON public.weekend_settlements FOR SELECT TO authenticated
  USING (public.app_is_active_member(team_id));

CREATE POLICY settlements_write_admin
  ON public.weekend_settlements FOR ALL TO authenticated
  USING (public.app_is_team_admin(team_id))
  WITH CHECK (public.app_is_team_admin(team_id));

CREATE POLICY charges_select_member
  ON public.settlement_charges FOR SELECT TO authenticated
  USING (public.app_is_active_member(team_id));

CREATE POLICY charges_update_self_or_admin
  ON public.settlement_charges FOR UPDATE TO authenticated
  USING (
    public.app_is_active_member(team_id)
    AND (user_id = auth.uid() OR public.app_is_team_admin(team_id))
  )
  WITH CHECK (
    public.app_is_active_member(team_id)
    AND (user_id = auth.uid() OR public.app_is_team_admin(team_id))
  );

CREATE POLICY charges_insert_admin
  ON public.settlement_charges FOR INSERT TO authenticated
  WITH CHECK (public.app_is_team_admin(team_id));

CREATE POLICY fund_accounts_select_member
  ON public.team_fund_accounts FOR SELECT TO authenticated
  USING (public.app_is_active_member(team_id));

CREATE POLICY fund_accounts_write_admin
  ON public.team_fund_accounts FOR ALL TO authenticated
  USING (public.app_is_team_admin(team_id))
  WITH CHECK (public.app_is_team_admin(team_id));

CREATE POLICY expenses_select_member
  ON public.expenses FOR SELECT TO authenticated
  USING (public.app_is_active_member(team_id));

CREATE POLICY expenses_write_admin
  ON public.expenses FOR ALL TO authenticated
  USING (public.app_is_team_admin(team_id))
  WITH CHECK (public.app_is_team_admin(team_id));

CREATE POLICY fund_txn_select_member
  ON public.team_fund_transactions FOR SELECT TO authenticated
  USING (public.app_is_active_member(team_id));

CREATE POLICY fund_txn_insert_admin
  ON public.team_fund_transactions FOR INSERT TO authenticated
  WITH CHECK (public.app_is_team_admin(team_id));

CREATE POLICY contribution_asks_select_member
  ON public.fund_contribution_asks FOR SELECT TO authenticated
  USING (public.app_is_active_member(team_id));

CREATE POLICY contribution_asks_write_admin
  ON public.fund_contribution_asks FOR ALL TO authenticated
  USING (public.app_is_team_admin(team_id))
  WITH CHECK (public.app_is_team_admin(team_id));

CREATE POLICY notifications_select_own
  ON public.notifications FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (user_id IS NULL AND team_id IS NOT NULL AND public.app_is_active_member(team_id))
  );

CREATE POLICY notifications_update_own
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_insert_admin
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    team_id IS NOT NULL
    AND public.app_is_team_admin(team_id)
  );

-- Seed fund account for Ranches Thunders
INSERT INTO public.team_fund_accounts (team_id, balance_inr)
SELECT id, 0
FROM public.teams
WHERE slug = 'ranches-thunders'
ON CONFLICT (team_id) DO NOTHING;

-- Payment proof storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY payment_proofs_upload_own
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY payment_proofs_update_own
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY payment_proofs_select_own_or_admin
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.app_is_any_active_member()
    )
  );
