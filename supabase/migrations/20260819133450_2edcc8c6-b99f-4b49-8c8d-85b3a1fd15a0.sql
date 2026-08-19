REVOKE EXECUTE ON FUNCTION public.entitlement_state(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_entitlement(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.entitlement_state(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_entitlement(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, integer) TO service_role;