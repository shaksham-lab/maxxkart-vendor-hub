
-- Files are stored at path: {vendor_id}/{filename}
-- Vendor can access files where the first folder segment matches a vendor row they own.

CREATE POLICY "vendor-docs vendor rw" ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'vendor-docs'
    AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.owner_user_id = auth.uid() AND v.id::text = (storage.foldername(name))[1])
  )
  WITH CHECK (
    bucket_id = 'vendor-docs'
    AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.owner_user_id = auth.uid() AND v.id::text = (storage.foldername(name))[1])
  );

CREATE POLICY "vendor-docs admin all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'vendor-docs' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'vendor-docs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "invoices vendor rw" ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'invoices'
    AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.owner_user_id = auth.uid() AND v.id::text = (storage.foldername(name))[1])
  )
  WITH CHECK (
    bucket_id = 'invoices'
    AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.owner_user_id = auth.uid() AND v.id::text = (storage.foldername(name))[1])
  );

CREATE POLICY "invoices admin all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'invoices' AND public.has_role(auth.uid(), 'admin'));
