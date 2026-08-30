CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  m jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(m->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;

  IF NEW.email IN ('admin@ad.com', 'hellt5409@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'vendor') ON CONFLICT DO NOTHING;

    IF COALESCE(m->>'vendor_name', '') <> ''
       AND NOT EXISTS (SELECT 1 FROM public.vendors v WHERE v.owner_user_id = NEW.id) THEN
      INSERT INTO public.vendors (
        owner_user_id, name, contact_person, phone, email, category, address, gst, status
      ) VALUES (
        NEW.id,
        m->>'vendor_name',
        COALESCE(m->>'contact_person', NEW.email),
        COALESCE(m->>'phone', ''),
        NEW.email,
        COALESCE(m->>'category', 'Other'),
        COALESCE(m->>'address', ''),
        COALESCE(m->>'gst', ''),
        'Pending'
      );
    END IF;
  END IF;
  RETURN NEW;
END; $function$;