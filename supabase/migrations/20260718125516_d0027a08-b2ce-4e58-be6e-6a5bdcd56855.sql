
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'vendor');
CREATE TYPE public.vendor_status AS ENUM ('Pending', 'Active', 'Rejected');
CREATE TYPE public.po_status AS ENUM ('Pending', 'Delivered', 'Completed');
CREATE TYPE public.invoice_status AS ENUM ('Pending Review', 'Approved', 'Rejected');
CREATE TYPE public.payment_status AS ENUM ('Pending', 'Paid');
CREATE TYPE public.document_type AS ENUM ('GST', 'PAN', 'Registration', 'Other');
CREATE TYPE public.document_status AS ENUM ('Pending', 'Verified', 'Rejected');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Vendors
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  gst TEXT NOT NULL,
  status public.vendor_status NOT NULL DEFAULT 'Pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all vendors" ON public.vendors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "vendor read own" ON public.vendors FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "vendor update own" ON public.vendors FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid() AND status = (SELECT status FROM public.vendors WHERE id = vendors.id));
CREATE POLICY "vendor self insert" ON public.vendors FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() AND status = 'Pending');

-- Vendor documents
CREATE TABLE public.vendor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  doc_type public.document_type NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status public.document_status NOT NULL DEFAULT 'Pending',
  reviewer_notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_documents TO authenticated;
GRANT ALL ON public.vendor_documents TO service_role;
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all docs" ON public.vendor_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "vendor own docs" ON public.vendor_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_user_id = auth.uid()));

-- Purchase orders
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE DEFAULT ('PO-' || to_char(now(), 'YYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 5)),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  status public.po_status NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all pos" ON public.purchase_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "vendor read own pos" ON public.purchase_orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_user_id = auth.uid()));
CREATE POLICY "vendor update own pos" ON public.purchase_orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_user_id = auth.uid()));

-- PO items
CREATE TABLE public.po_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qty NUMERIC(10,2) NOT NULL,
  price NUMERIC(14,2) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.po_items TO authenticated;
GRANT ALL ON public.po_items TO service_role;
ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all items" ON public.po_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "vendor read own items" ON public.po_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.purchase_orders p JOIN public.vendors v ON v.id = p.vendor_id
                 WHERE p.id = po_id AND v.owner_user_id = auth.uid()));

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE DEFAULT ('INV-' || to_char(now(), 'YYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 5)),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'Pending Review',
  payment public.payment_status NOT NULL DEFAULT 'Pending',
  admin_notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all inv" ON public.invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "vendor read own inv" ON public.invoices FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_user_id = auth.uid()));
CREATE POLICY "vendor insert own inv" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_user_id = auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER tg_vendors_updated BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER tg_pos_updated BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
