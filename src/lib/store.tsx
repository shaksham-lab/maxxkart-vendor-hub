import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "admin" | "vendor";
export type User = {
  id: string;
  email: string;
  password: string;
  role: Role;
  vendorId?: string;
};
export type VendorStatus = "Pending" | "Active" | "Rejected";
export type Vendor = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  address: string;
  gst: string;
  status: VendorStatus;
  rejectionReason?: string;
};
export type POItem = { name: string; qty: number; price: number };
export type POStatus = "Pending" | "Delivered" | "Completed";
export type PurchaseOrder = {
  id: string;
  vendorId: string;
  items: POItem[];
  total: number;
  status: POStatus;
  createdAt: string;
};
export type InvoiceStatus = "Pending Review" | "Approved" | "Rejected";
export type PaymentStatus = "Pending" | "Paid";
export type Invoice = {
  id: string;
  poId: string;
  vendorId: string;
  fileName: string;
  amount: number;
  status: InvoiceStatus;
  payment: PaymentStatus;
  uploadedAt: string;
};

export type DB = {
  users: User[];
  vendors: Vendor[];
  orders: PurchaseOrder[];
  invoices: Invoice[];
  session: { userId: string | null };
};

export const CATEGORIES = ["Groceries", "Dairy", "Bakery", "Household", "Electronics"];

const KEY = "maxxkart_db_v3";

function seed(): DB {
  const vendors: Vendor[] = [
    { id: "v1", name: "FreshFarms Co.", contactPerson: "Ravi Kumar", phone: "9876543210", email: "vendor@vd.com", category: "Groceries", address: "12 Market Rd, Mumbai", gst: "27ABCDE1234F1Z5", status: "Active" },
    { id: "v2", name: "DailyMoo Dairy", contactPerson: "Priya Shah", phone: "9000011122", email: "priya@dailymoo.com", category: "Dairy", address: "88 Milk Lane, Pune", gst: "27DAIRY9999K1Z2", status: "Active" },
    { id: "v3", name: "GoldenCrust Bakery", contactPerson: "Ali Rehman", phone: "9123456789", email: "ali@goldencrust.com", category: "Bakery", address: "5 Baker St, Delhi", gst: "07BAKER1111L1Z9", status: "Pending" },
    { id: "v4", name: "HomeGlow Household", contactPerson: "Neha Verma", phone: "9988777665", email: "neha@homeglow.in", category: "Household", address: "23 Green Ave, Bangalore", gst: "29HOMEG2222M1Z8", status: "Rejected", rejectionReason: "Incomplete documentation" },
    { id: "v5", name: "VoltEdge Electronics", contactPerson: "Sameer Roy", phone: "9090980808", email: "sameer@voltedge.com", category: "Electronics", address: "9 Tech Park, Hyderabad", gst: "36VOLT33333N1Z1", status: "Active" },
  ];
  const users: User[] = [
    { id: "u1", email: "admin@ad.com", password: "Admin_123", role: "admin" },
    { id: "u2", email: "vendor@vd.com", password: "Vendor_123", role: "vendor", vendorId: "v1" },
  ];
  const orders: PurchaseOrder[] = [
    { id: "PO-1001", vendorId: "v1", items: [{ name: "Basmati Rice 25kg", qty: 20, price: 1800 }, { name: "Toor Dal 10kg", qty: 15, price: 1400 }], total: 20 * 1800 + 15 * 1400, status: "Completed", createdAt: "2026-06-20" },
    { id: "PO-1002", vendorId: "v2", items: [{ name: "Full Cream Milk 1L", qty: 200, price: 62 }], total: 200 * 62, status: "Delivered", createdAt: "2026-07-01" },
    { id: "PO-1003", vendorId: "v1", items: [{ name: "Sunflower Oil 5L", qty: 40, price: 750 }], total: 40 * 750, status: "Pending", createdAt: "2026-07-10" },
    { id: "PO-1004", vendorId: "v3", items: [{ name: "Whole Wheat Bread", qty: 300, price: 45 }, { name: "Croissant", qty: 150, price: 55 }], total: 300 * 45 + 150 * 55, status: "Delivered", createdAt: "2026-07-08" },
    { id: "PO-1005", vendorId: "v5", items: [{ name: "LED Bulb 9W", qty: 200, price: 110 }], total: 200 * 110, status: "Pending", createdAt: "2026-07-12" },
  ];
  const invoices: Invoice[] = [
    { id: "INV-9001", poId: "PO-1001", vendorId: "v1", fileName: "freshfarms-june.pdf", amount: 20 * 1800 + 15 * 1400, status: "Approved", payment: "Paid", uploadedAt: "2026-06-28" },
    { id: "INV-9002", poId: "PO-1002", vendorId: "v2", fileName: "dailymoo-july.pdf", amount: 200 * 62, status: "Approved", payment: "Pending", uploadedAt: "2026-07-05" },
    { id: "INV-9003", poId: "PO-1004", vendorId: "v3", fileName: "goldencrust-july.pdf", amount: 300 * 45 + 150 * 55, status: "Pending Review", payment: "Pending", uploadedAt: "2026-07-11" },
  ];
  return { users, vendors, orders, invoices, session: { userId: null } };
}

function load(): DB {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw) as DB;
  } catch {
    return seed();
  }
}

type Ctx = {
  db: DB;
  update: (fn: (db: DB) => DB) => void;
  currentUser: () => User | null;
  currentVendor: () => Vendor | null;
  login: (email: string, password: string) => User | null;
  signup: (email: string, password: string, role: Role, vendorId?: string) => User;
  logout: () => void;
  reset: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => seed());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDb(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(db));
  }, [db, hydrated]);

  const update = (fn: (db: DB) => DB) => setDb((prev) => fn(structuredClone(prev)));

  const value: Ctx = {
    db,
    update,
    currentUser: () => db.users.find((u) => u.id === db.session.userId) ?? null,
    currentVendor: () => {
      const u = db.users.find((x) => x.id === db.session.userId);
      if (!u?.vendorId) return null;
      return db.vendors.find((v) => v.id === u.vendorId) ?? null;
    },
    login: (email, password) => {
      const u = db.users.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
      if (u) update((d) => ({ ...d, session: { userId: u.id } }));
      return u ?? null;
    },
    signup: (email, password, role, vendorId) => {
      const u: User = { id: `u${Date.now()}`, email, password, role, vendorId };
      update((d) => ({ ...d, users: [...d.users, u], session: { userId: u.id } }));
      return u;
    },
    logout: () => update((d) => ({ ...d, session: { userId: null } })),
    reset: () => setDb(seed()),
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
