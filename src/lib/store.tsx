import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type Role = "admin" | "vendor";
export type VendorStatus = "Pending" | "Active" | "Rejected";
export type POStatus = "Pending" | "Delivered" | "Completed";
export type InvoiceStatus = "Pending Review" | "Approved" | "Rejected";
export type PaymentStatus = "Pending" | "Paid";
export type DocumentType = "GST" | "PAN" | "Registration" | "Other";
export type DocumentStatus = "Pending" | "Verified" | "Rejected";

export type Vendor = {
  id: string;
  ownerUserId: string | null;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  address: string;
  gst: string;
  status: VendorStatus;
  rejectionReason?: string | null;
};

export type POItem = { id?: string; name: string; qty: number; price: number };

export type PurchaseOrder = {
  id: string;              // uuid pk
  poNumber: string;        // display
  vendorId: string;
  items: POItem[];
  total: number;
  status: POStatus;
  createdAt: string;
};

export type Invoice = {
  id: string;              // uuid pk
  invoiceNumber: string;
  poId: string;            // uuid pk of PO
  poNumber: string;        // display
  vendorId: string;
  fileName: string;
  filePath: string;
  amount: number;
  status: InvoiceStatus;
  payment: PaymentStatus;
  uploadedAt: string;
};

export type VendorDocument = {
  id: string;
  vendorId: string;
  docType: DocumentType;
  fileName: string;
  filePath: string;
  status: DocumentStatus;
  reviewerNotes?: string | null;
  uploadedAt: string;
};

export type CurrentUser = { id: string; email: string; role: Role | null };

export type RegisterInput = {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  address: string;
  gst: string;
  password: string;
};

export type LoginResult =
  | { ok: true; role: Role }
  | { ok: false; reason: "invalid" | "pending" | "rejected" | "unassigned"; rejectionReason?: string };

export const CATEGORIES = ["Groceries", "Dairy", "Bakery", "Household", "Electronics"];

type Ctx = {
  loading: boolean;
  session: Session | null;
  user: CurrentUser | null;
  vendors: Vendor[];
  orders: PurchaseOrder[];
  invoices: Invoice[];
  documents: VendorDocument[];
  currentVendor: Vendor | null;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<LoginResult>;
  signUp: (input: RegisterInput) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
  updateVendor: (id: string, patch: Partial<Pick<Vendor, "name" | "contactPerson" | "phone" | "email" | "address">>) => Promise<void>;
  setVendorStatus: (id: string, status: VendorStatus, reason?: string) => Promise<void>;
  createPO: (vendorId: string, items: POItem[]) => Promise<void>;
  updatePOStatus: (id: string, status: POStatus) => Promise<void>;
  createInvoice: (input: { poId: string; vendorId: string; file: File }) => Promise<void>;
  setInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
  markInvoicePaid: (id: string) => Promise<void>;
  uploadVendorDoc: (vendorId: string, docType: DocumentType, file: File) => Promise<void>;
  setDocumentStatus: (id: string, status: DocumentStatus, notes?: string) => Promise<void>;
  getSignedUrl: (bucket: "vendor-docs" | "invoices", path: string) => Promise<string | null>;
};

const StoreContext = createContext<Ctx | null>(null);

function mapVendor(row: any): Vendor {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    category: row.category,
    address: row.address,
    gst: row.gst,
    status: row.status,
    rejectionReason: row.rejection_reason,
  };
}
function mapPO(row: any): PurchaseOrder {
  return {
    id: row.id,
    poNumber: row.po_number,
    vendorId: row.vendor_id,
    items: (row.po_items ?? []).map((i: any) => ({ id: i.id, name: i.name, qty: Number(i.qty), price: Number(i.price) })),
    total: Number(row.total),
    status: row.status,
    createdAt: (row.created_at as string).slice(0, 10),
  };
}
function mapInvoice(row: any): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    poId: row.po_id,
    poNumber: row.purchase_orders?.po_number ?? "",
    vendorId: row.vendor_id,
    fileName: row.file_name,
    filePath: row.file_path,
    amount: Number(row.amount),
    status: row.status,
    payment: row.payment,
    uploadedAt: (row.uploaded_at as string).slice(0, 10),
  };
}
function mapDoc(row: any): VendorDocument {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    docType: row.doc_type,
    fileName: row.file_name,
    filePath: row.file_path,
    status: row.status,
    reviewerNotes: row.reviewer_notes,
    uploadedAt: (row.uploaded_at as string).slice(0, 10),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const roleRef = useRef<Role | null>(null);

  const loadRole = useCallback(async (uid: string): Promise<Role | null> => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle();
    return (data?.role as Role | undefined) ?? null;
  }, []);

  const loadAll = useCallback(async (u: CurrentUser | null) => {
    if (!u || !u.role) {
      setVendors([]); setOrders([]); setInvoices([]); setDocuments([]); return;
    }
    const [{ data: vs }, { data: os }, { data: is }, { data: ds }] = await Promise.all([
      supabase.from("vendors").select("*").order("created_at", { ascending: false }),
      supabase.from("purchase_orders").select("*, po_items(*)").order("created_at", { ascending: false }),
      supabase.from("invoices").select("*, purchase_orders(po_number)").order("uploaded_at", { ascending: false }),
      supabase.from("vendor_documents").select("*").order("uploaded_at", { ascending: false }),
    ]);
    setVendors((vs ?? []).map(mapVendor));
    setOrders((os ?? []).map(mapPO));
    setInvoices((is ?? []).map(mapInvoice));
    setDocuments((ds ?? []).map(mapDoc));
  }, []);

  const hydrateFromSession = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!s?.user) { setUser(null); roleRef.current = null; await loadAll(null); setLoading(false); return; }
    const role = await loadRole(s.user.id);
    roleRef.current = role;
    const u: CurrentUser = { id: s.user.id, email: s.user.email ?? "", role };
    setUser(u);
    await loadAll(u);
    setLoading(false);
  }, [loadAll, loadRole]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => { if (mounted) hydrateFromSession(data.session); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(() => hydrateFromSession(s), 0);
      }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [hydrateFromSession]);

  const refresh = useCallback(async () => { await loadAll(user); }, [loadAll, user]);

  const currentVendor = useMemo(() => {
    if (!user) return null;
    return vendors.find((v) => v.ownerUserId === user.id) ?? null;
  }, [vendors, user]);

  const signIn: Ctx["signIn"] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return { ok: false, reason: "invalid" };
    const role = await loadRole(data.user.id);
    if (!role) { await supabase.auth.signOut(); return { ok: false, reason: "unassigned" }; }
    if (role === "vendor") {
      const { data: v } = await supabase.from("vendors").select("status, rejection_reason").eq("owner_user_id", data.user.id).maybeSingle();
      if (v?.status === "Pending") { await supabase.auth.signOut(); return { ok: false, reason: "pending" }; }
      if (v?.status === "Rejected") { await supabase.auth.signOut(); return { ok: false, reason: "rejected", rejectionReason: v.rejection_reason ?? undefined }; }
    }
    return { ok: true, role };
  };

  const signUp: Ctx["signUp"] = async (input) => {
    const email = input.email.trim().toLowerCase();
    const redirectUrl = `${window.location.origin}/login`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: { emailRedirectTo: redirectUrl, data: { full_name: input.contactPerson } },
    });
    if (error) return { ok: false, message: error.message };
    if (!data.user) return { ok: false, message: "Signup failed" };
    // Vendor row must be created while a session exists.
    const { error: vErr } = await supabase.from("vendors").insert({
      owner_user_id: data.user.id,
      name: input.name.trim(),
      contact_person: input.contactPerson.trim(),
      phone: input.phone.trim(),
      email,
      category: input.category,
      address: input.address.trim(),
      gst: input.gst.trim().toUpperCase(),
      status: "Pending",
    });
    if (vErr) return { ok: false, message: vErr.message };
    await supabase.auth.signOut();
    return { ok: true };
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const updateVendor: Ctx["updateVendor"] = async (id, patch) => {
    const row: any = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.contactPerson !== undefined) row.contact_person = patch.contactPerson;
    if (patch.phone !== undefined) row.phone = patch.phone;
    if (patch.email !== undefined) row.email = patch.email;
    if (patch.address !== undefined) row.address = patch.address;
    const { error } = await supabase.from("vendors").update(row).eq("id", id);
    if (error) throw error;
    await refresh();
  };

  const setVendorStatus: Ctx["setVendorStatus"] = async (id, status, reason) => {
    const { error } = await supabase.from("vendors").update({ status, rejection_reason: reason ?? null }).eq("id", id);
    if (error) throw error;
    await refresh();
  };

  const createPO: Ctx["createPO"] = async (vendorId, items) => {
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    const { data, error } = await supabase.from("purchase_orders").insert({ vendor_id: vendorId, total }).select().single();
    if (error) throw error;
    const { error: iErr } = await supabase.from("po_items").insert(items.map((i) => ({ po_id: data.id, name: i.name, qty: i.qty, price: i.price })));
    if (iErr) throw iErr;
    await refresh();
  };

  const updatePOStatus: Ctx["updatePOStatus"] = async (id, status) => {
    const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
    if (error) throw error;
    await refresh();
  };

  const createInvoice: Ctx["createInvoice"] = async ({ poId, vendorId, file }) => {
    const path = `${vendorId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("invoices").upload(path, file);
    if (upErr) throw upErr;
    const po = orders.find((o) => o.id === poId);
    const amount = po?.total ?? 0;
    const { error } = await supabase.from("invoices").insert({
      po_id: poId, vendor_id: vendorId, file_name: file.name, file_path: path, amount,
    });
    if (error) throw error;
    await refresh();
  };

  const setInvoiceStatus: Ctx["setInvoiceStatus"] = async (id, status) => {
    const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
    if (error) throw error;
    await refresh();
  };

  const markInvoicePaid: Ctx["markInvoicePaid"] = async (id) => {
    const inv = invoices.find((x) => x.id === id);
    const { error } = await supabase.from("invoices").update({ payment: "Paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    if (inv) await supabase.from("purchase_orders").update({ status: "Completed" }).eq("id", inv.poId);
    await refresh();
  };

  const uploadVendorDoc: Ctx["uploadVendorDoc"] = async (vendorId, docType, file) => {
    const path = `${vendorId}/${docType}_${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("vendor-docs").upload(path, file);
    if (upErr) throw upErr;
    const { error } = await supabase.from("vendor_documents").insert({
      vendor_id: vendorId, doc_type: docType, file_name: file.name, file_path: path,
    });
    if (error) throw error;
    await refresh();
  };

  const setDocumentStatus: Ctx["setDocumentStatus"] = async (id, status, notes) => {
    const { error } = await supabase.from("vendor_documents").update({
      status, reviewer_notes: notes ?? null, reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) throw error;
    await refresh();
  };

  const getSignedUrl: Ctx["getSignedUrl"] = async (bucket, path) => {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
    return data?.signedUrl ?? null;
  };

  const value: Ctx = {
    loading, session, user, vendors, orders, invoices, documents, currentVendor,
    refresh, signIn, signUp, signOut,
    updateVendor, setVendorStatus,
    createPO, updatePOStatus,
    createInvoice, setInvoiceStatus, markInvoicePaid,
    uploadVendorDoc, setDocumentStatus, getSignedUrl,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
