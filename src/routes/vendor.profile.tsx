import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, formatCurrency } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Pencil, Save, X, ShieldAlert, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/vendor/profile")({
  component: VendorProfile,
});

const nameRe = /^[A-Za-z][A-Za-z\s.'&-]{1,99}$/;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^[0-9]{10}$/;

function VendorProfile() {
  const { db, update, currentVendor, currentUser } = useStore();
  const vendor = currentVendor();
  const user = currentUser();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    name: vendor?.name ?? "",
    contactPerson: vendor?.contactPerson ?? "",
    phone: vendor?.phone ?? "",
    email: vendor?.email ?? "",
    address: vendor?.address ?? "",
  }));

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || !nameRe.test(form.name.trim())) e.name = "Enter a valid business name";
    if (!form.contactPerson.trim() || !nameRe.test(form.contactPerson.trim())) e.contactPerson = "Only letters and spaces";
    if (!form.phone.trim() || !phoneRe.test(form.phone.trim())) e.phone = "Phone must be exactly 10 digits";
    if (!form.email.trim() || !emailRe.test(form.email.trim())) e.email = "Enter a valid email";
    else if (
      db.users.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.id !== user?.id) ||
      db.vendors.some((v) => v.email.toLowerCase() === form.email.trim().toLowerCase() && v.id !== vendor?.id)
    ) e.email = "This email is already in use";
    if (!form.address.trim() || form.address.trim().length < 10) e.address = "At least 10 characters";
    return e;
  }, [form, db.users, db.vendors, user?.id, vendor?.id]);
  const isValid = Object.keys(errors).length === 0;

  if (!vendor) return null;

  const orders = db.orders.filter((o) => o.vendorId === vendor.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function cancel() {
    setForm({
      name: vendor!.name, contactPerson: vendor!.contactPerson, phone: vendor!.phone,
      email: vendor!.email, address: vendor!.address,
    });
    setEditing(false);
  }

  function save() {
    if (!isValid) return;
    update((d) => {
      d.vendors = d.vendors.map((v) => v.id === vendor!.id ? {
        ...v,
        name: form.name.trim(),
        contactPerson: form.contactPerson.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        address: form.address.trim(),
      } : v);
      if (user) d.users = d.users.map((u) => u.id === user.id ? { ...u, email: form.email.trim().toLowerCase() } : u);
      return d;
    });
    setEditing(false);
    toast.success("Profile updated");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-1">Your details on file with Maxxkart.</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={vendor.status} />
          {!editing ? (
            <Button onClick={() => setEditing(true)} className="rounded-full bg-primary hover:bg-primary-deep hover:shadow-glow">
              <Pencil className="h-4 w-4 mr-1.5" /> Edit profile
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={cancel} className="rounded-full">
                <X className="h-4 w-4 mr-1.5" /> Cancel
              </Button>
              <Button onClick={save} disabled={!isValid} className="rounded-full bg-primary hover:bg-primary-deep disabled:opacity-50">
                <Save className="h-4 w-4 mr-1.5" /> Save changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card-soft p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business Name" error={editing && errors.name}>
              {editing ? (
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl" />
              ) : <ReadOnly value={vendor.name} />}
            </Field>
            <Field label="Contact Person" error={editing && errors.contactPerson}>
              {editing ? (
                <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="h-11 rounded-xl" />
              ) : <ReadOnly value={vendor.contactPerson} />}
            </Field>
            <Field label="Phone" error={editing && errors.phone}>
              {editing ? (
                <Input inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} className="h-11 rounded-xl" />
              ) : <ReadOnly value={vendor.phone} />}
            </Field>
            <Field label="Email" error={editing && errors.email}>
              {editing ? (
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 rounded-xl" />
              ) : <ReadOnly value={vendor.email} />}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address" error={editing && errors.address}>
                {editing ? (
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-11 rounded-xl" />
                ) : <ReadOnly value={vendor.address} />}
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-dashed bg-accent/30 p-4">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Category and GST Number are locked. Contact the Maxxkart Admin to request changes to these fields.
              </p>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <div className="mt-1.5 h-11 rounded-xl bg-white border flex items-center px-3 text-sm">{vendor.category}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">GST Number</Label>
                <div className="mt-1.5 h-11 rounded-xl bg-white border flex items-center px-3 font-mono text-sm">{vendor.gst}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-soft p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Order history</h3>
          </div>
          <ul className="divide-y">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{o.id}</p>
                  <p className="text-xs text-muted-foreground">{o.createdAt}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(o.total)}</p>
                  <StatusBadge status={o.status} className="mt-1" />
                </div>
              </li>
            ))}
            {orders.length === 0 && (
              <li className="py-10 text-center text-muted-foreground text-sm">No orders yet</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string | false | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function ReadOnly({ value }: { value: string }) {
  return <div className="h-11 rounded-xl bg-accent/40 border border-transparent flex items-center px-3 text-sm">{value}</div>;
}
