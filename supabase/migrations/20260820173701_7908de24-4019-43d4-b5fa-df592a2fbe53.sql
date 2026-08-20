
CREATE TABLE public.access_codes (
  code text PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  unlimited_days integer NOT NULL DEFAULT 3650,
  max_uses integer NOT NULL DEFAULT 1,
  uses integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.access_codes TO service_role;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL REFERENCES public.access_codes(code) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
GRANT SELECT ON public.code_redemptions TO authenticated;
GRANT ALL ON public.code_redemptions TO service_role;
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own redemptions" ON public.code_redemptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS unlimited_until timestamptz;

INSERT INTO public.access_codes (code, label, unlimited_days, max_uses)
VALUES ('CARIQ-UNLIMITED', 'Obegränsad tillgång', 3650, 100)
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.redeem_access_code(_user_id uuid, _code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ac public.access_codes%ROWTYPE;
  norm text := upper(btrim(_code));
  until timestamptz;
BEGIN
  SELECT * INTO ac FROM public.access_codes WHERE upper(code) = norm FOR UPDATE;
  IF ac.code IS NULL OR ac.active = false THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid');
  END IF;

  IF EXISTS (SELECT 1 FROM public.code_redemptions WHERE user_id = _user_id AND code = ac.code) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already');
  END IF;

  IF ac.uses >= ac.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'exhausted');
  END IF;

  until := now() + make_interval(days => ac.unlimited_days);

  INSERT INTO public.entitlements (user_id, unlimited_until)
  VALUES (_user_id, until)
  ON CONFLICT (user_id) DO UPDATE
  SET unlimited_until = GREATEST(COALESCE(public.entitlements.unlimited_until, now()), until),
      updated_at = now();

  INSERT INTO public.code_redemptions (user_id, code) VALUES (_user_id, ac.code);
  UPDATE public.access_codes SET uses = uses + 1 WHERE code = ac.code;

  RETURN jsonb_build_object('ok', true, 'until', until);
END;
$function$;

CREATE OR REPLACE FUNCTION public.entitlement_state(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sub public.subscriptions%ROWTYPE;
  ent public.entitlements%ROWTYPE;
  used integer := 0;
  free_quick integer := 0;
BEGIN
  SELECT * INTO ent FROM public.entitlements WHERE user_id = _user_id;

  IF ent.unlimited_until IS NOT NULL AND ent.unlimited_until > now() THEN
    RETURN jsonb_build_object(
      'plan', 'unlimited',
      'unlimited', true,
      'unlimitedUntil', ent.unlimited_until,
      'monthlyLimit', 999999,
      'monthlyUsed', 0,
      'monthlyLeft', 999999,
      'credits', COALESCE(ent.credits, 0),
      'periodEnd', ent.unlimited_until,
      'cancelAtPeriodEnd', false,
      'freeQuickLeft', 999999,
      'left', 999999
    );
  END IF;

  SELECT * INTO sub FROM public.subscriptions
  WHERE user_id = _user_id
    AND status IN ('active', 'trialing', 'past_due', 'canceled')
    AND (current_period_end IS NULL OR current_period_end > now())
    AND status <> 'paused'
  ORDER BY created_at DESC
  LIMIT 1;

  free_quick := CASE
    WHEN ent.user_id IS NULL THEN 1
    WHEN ent.free_quick_month IS DISTINCT FROM date_trunc('month', now())::date THEN 1
    ELSE 0
  END;

  IF sub.id IS NOT NULL THEN
    used := CASE
      WHEN ent.user_id IS NULL THEN 0
      WHEN ent.period_anchor IS DISTINCT FROM sub.current_period_start THEN 0
      ELSE ent.period_uses
    END;
    RETURN jsonb_build_object(
      'plan', 'pro',
      'unlimited', false,
      'monthlyLimit', 5,
      'monthlyUsed', used,
      'monthlyLeft', GREATEST(5 - used, 0),
      'credits', COALESCE(ent.credits, 0),
      'periodEnd', sub.current_period_end,
      'cancelAtPeriodEnd', sub.cancel_at_period_end,
      'freeQuickLeft', free_quick,
      'left', GREATEST(5 - used, 0) + COALESCE(ent.credits, 0)
    );
  END IF;

  RETURN jsonb_build_object(
    'plan', 'free',
    'unlimited', false,
    'monthlyLimit', 0,
    'monthlyUsed', 0,
    'monthlyLeft', 0,
    'credits', COALESCE(ent.credits, 0),
    'periodEnd', NULL,
    'cancelAtPeriodEnd', false,
    'freeQuickLeft', free_quick,
    'left', COALESCE(ent.credits, 0)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.consume_entitlement(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sub public.subscriptions%ROWTYPE;
  ent public.entitlements%ROWTYPE;
  used integer := 0;
BEGIN
  INSERT INTO public.entitlements (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO ent FROM public.entitlements WHERE user_id = _user_id FOR UPDATE;

  IF ent.unlimited_until IS NOT NULL AND ent.unlimited_until > now() THEN
    RETURN jsonb_build_object('allowed', true, 'source', 'unlimited', 'left', 999999);
  END IF;

  SELECT * INTO sub FROM public.subscriptions
  WHERE user_id = _user_id
    AND status IN ('active', 'trialing', 'past_due', 'canceled')
    AND (current_period_end IS NULL OR current_period_end > now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF sub.id IS NOT NULL THEN
    used := CASE
      WHEN ent.period_anchor IS DISTINCT FROM sub.current_period_start THEN 0
      ELSE ent.period_uses
    END;
    IF used < 5 THEN
      UPDATE public.entitlements
      SET period_uses = used + 1,
          period_anchor = sub.current_period_start,
          updated_at = now()
      WHERE user_id = _user_id;
      RETURN jsonb_build_object('allowed', true, 'source', 'subscription', 'left', (5 - used - 1) + ent.credits);
    END IF;
  END IF;

  IF ent.credits > 0 THEN
    UPDATE public.entitlements
    SET credits = ent.credits - 1, updated_at = now()
    WHERE user_id = _user_id;
    RETURN jsonb_build_object('allowed', true, 'source', 'credit', 'left', ent.credits - 1);
  END IF;

  RETURN jsonb_build_object('allowed', false, 'source', 'none', 'left', 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.consume_free_quick(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ent public.entitlements%ROWTYPE;
  this_month date := date_trunc('month', now())::date;
BEGIN
  INSERT INTO public.entitlements (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO ent FROM public.entitlements WHERE user_id = _user_id FOR UPDATE;

  IF ent.unlimited_until IS NOT NULL AND ent.unlimited_until > now() THEN
    RETURN jsonb_build_object('allowed', true, 'source', 'unlimited');
  END IF;

  IF ent.free_quick_month IS DISTINCT FROM this_month THEN
    UPDATE public.entitlements
    SET free_quick_month = this_month, updated_at = now()
    WHERE user_id = _user_id;
    RETURN jsonb_build_object('allowed', true, 'source', 'free_quick');
  END IF;

  RETURN jsonb_build_object('allowed', false, 'source', 'none');
END;
$function$;
