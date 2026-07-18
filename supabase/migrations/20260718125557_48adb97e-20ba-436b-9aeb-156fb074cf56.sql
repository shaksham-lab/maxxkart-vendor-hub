
ALTER FUNCTION public.tg_touch_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- has_role stays callable by authenticated (used in RLS policies via SECURITY DEFINER helper)
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
