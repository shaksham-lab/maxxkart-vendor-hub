-- 1. Prevent vendors from changing their own approval status
DROP POLICY IF EXISTS "vendor update own" ON public.vendors;

CREATE POLICY "vendor update own" ON public.vendors
FOR UPDATE TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.tg_vendors_guard_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change vendor status';
  END IF;
  IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change rejection reason';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.tg_vendors_guard_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tg_vendors_guard_status ON public.vendors;
CREATE TRIGGER tg_vendors_guard_status
BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.tg_vendors_guard_status();

-- 2. Fix storage ownership checks to use the object's own path
DROP POLICY IF EXISTS "vendor-docs vendor rw" ON storage.objects;
CREATE POLICY "vendor-docs vendor rw" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'vendor-docs'
  AND EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.owner_user_id = auth.uid()
      AND (v.id)::text = (storage.foldername(storage.objects.name))[1]
  )
)
WITH CHECK (
  bucket_id = 'vendor-docs'
  AND EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.owner_user_id = auth.uid()
      AND (v.id)::text = (storage.foldername(storage.objects.name))[1]
  )
);

DROP POLICY IF EXISTS "invoices vendor rw" ON storage.objects;
CREATE POLICY "invoices vendor rw" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.owner_user_id = auth.uid()
      AND (v.id)::text = (storage.foldername(storage.objects.name))[1]
  )
)
WITH CHECK (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.owner_user_id = auth.uid()
      AND (v.id)::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- 3. Remove direct execute access to internal trigger functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon, authenticated;