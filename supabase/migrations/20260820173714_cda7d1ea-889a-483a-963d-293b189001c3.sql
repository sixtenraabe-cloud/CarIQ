REVOKE ALL ON FUNCTION public.redeem_access_code(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_access_code(uuid, text) TO service_role;