ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS free_quick_month date;

CREATE OR REPLACE FUNCTION public.consume_free_quick(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ent public.entitlements%ROWTYPE;
  this_month date := date_trunc('month', now())::date;
BEGIN
  INSERT INTO public.entitlements (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO ent FROM public.entitlements WHERE user_id = _user_id FOR UPDATE;

  IF ent.free_quick_month IS DISTINCT FROM this_month THEN
    UPDATE public.entitlements
    SET free_quick_month = this_month, updated_at = now()
    WHERE user_id = _user_id;
    RETURN jsonb_build_object('allowed', true, 'source', 'free_quick');
  END IF;

  RETURN jsonb_build_object('allowed', false, 'source', 'none');
END;
$$;
REVOKE ALL ON FUNCTION public.consume_free_quick(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.consume_free_quick(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.entitlement_state(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub public.subscriptions%ROWTYPE;
  ent public.entitlements%ROWTYPE;
  used integer := 0;
  free_quick integer := 0;
BEGIN
  SELECT * INTO sub FROM public.subscriptions
  WHERE user_id = _user_id
    AND status IN ('active', 'trialing', 'past_due', 'canceled')
    AND (current_period_end IS NULL OR current_period_end > now())
    AND status <> 'paused'
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT * INTO ent FROM public.entitlements WHERE user_id = _user_id;

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
$$;
REVOKE ALL ON FUNCTION public.entitlement_state(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.entitlement_state(uuid) TO service_role;