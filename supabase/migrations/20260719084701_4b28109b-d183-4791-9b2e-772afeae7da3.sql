
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  IF NEW.email IN ('admin@ad.com', 'hellt5409@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'vendor') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $function$;

-- Promote existing user if already signed up
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'hellt5409@gmail.com'
ON CONFLICT DO NOTHING;

-- Remove any vendor role for that user
DELETE FROM public.user_roles
WHERE role = 'vendor'
  AND user_id IN (SELECT id FROM auth.users WHERE email = 'hellt5409@gmail.com');
