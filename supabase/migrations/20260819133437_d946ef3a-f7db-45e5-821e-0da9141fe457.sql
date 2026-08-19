CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_subscription_id text NOT NULL UNIQUE,
  paddle_customer_id text NOT NULL DEFAULT '',
  product_id text NOT NULL DEFAULT '',
  price_id text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.entitlements (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits integer NOT NULL DEFAULT 0,
  period_anchor timestamptz,
  period_uses integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.entitlements TO authenticated;
GRANT ALL ON public.entitlements TO service_role;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their own entitlements" ON public.entitlements FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.payment_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

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
BEGIN
  SELECT * INTO sub FROM public.subscriptions
  WHERE user_id = _user_id
    AND status IN ('active', 'trialing', 'past_due', 'canceled')
    AND (current_period_end IS NULL OR current_period_end > now())
    AND status <> 'paused'
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT * INTO ent FROM public.entitlements WHERE user_id = _user_id;

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
    'left', COALESCE(ent.credits, 0)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.entitlement_state(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.entitlement_state(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.consume_entitlement(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub public.subscriptions%ROWTYPE;
  ent public.entitlements%ROWTYPE;
  used integer := 0;
BEGIN
  INSERT INTO public.entitlements (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO ent FROM public.entitlements WHERE user_id = _user_id FOR UPDATE;

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
$$;
REVOKE ALL ON FUNCTION public.consume_entitlement(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.consume_entitlement(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.grant_credits(_user_id uuid, _amount integer)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.entitlements (user_id, credits)
  VALUES (_user_id, GREATEST(_amount, 0))
  ON CONFLICT (user_id) DO UPDATE
  SET credits = public.entitlements.credits + GREATEST(_amount, 0),
      updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.grant_credits(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, integer) TO service_role;

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();