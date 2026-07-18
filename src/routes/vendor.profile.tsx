import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, formatCurrency, type DocumentType } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Pencil, Save, X, ShieldAlert, ClipboardList, Upload, FileCheck2, Eye } from "lucide-react";

export const Route = createFileRoute("/vendor/profile")({
  component: VendorProfile,
});

const nameRe = /^[A-Za-z][A-Za-z\s.'&-]{1,99}$/;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^[0-9]{10}$/;

const DOC_TYPES: DocumentType[] = ["GST", "PAN", "Registration", "Other"];

function VendorProfile() {
  const { orders, documents, currentVendor, updateVendor, uploadVendorDoc, getSignedUrl } = useStore();
  const vendor = currentVendor;
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(() => ({
    name: vendor?.name ?? "",
    contactPerson: vendor?.contactPerson ?? "",
    phone: vendor?.phone ?? "",
    email: vendor?.email ?? "",
    address: vendor?.address ?? "",
  }));
  const [docType, setDocType] = useState<DocumentType>("GST");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || !nameRe.test(form.name.trim())) e.name = "Enter a valid business name";
    if (!form.contactPerson.trim() || !nameRe.test(form.contactPerson.trim())) e.contactPerson = "Only letters and spaces";
    if (!form.phone.trim() || !phoneRe.test(form.phone.trim())) e.phone = "Phone must be exactly 10 digits";
    if (!form.email.trim() || !emailRe.test(form.email.trim())) e.email = "Enter a valid email";
    if (!form.address.trim() || form.address.trim().length < 10) e.address = "At least 10 characters";
    return e;
  }, [form]);
  const isValid = Object.keys(errors).length === 0;

  if (!vendor) return null;

  const myOrders = orders.filter((o) => o.vendorId === vendor.id);
  const myDocs = documents.filter((d) => d.vendorId === vendor.id);

  function cancel() {
    setForm({
      name: vendor!.name, contactPerson: vendor!.contactPerson, phone: vendor!.phone,
      email: vendor!.email, address: vendor!.address,
    });
    setEditing(false);
  }

  async function save() {
    if (!isValid) return;
    setBusy(true);
    try {
      await updateVendor(vendor!.id, {
        name: form.name.trim(),
        contactPerson: form.contactPerson.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        address: form.address.trim(),
      });
      setEditing(false); toast.success("Profile updated");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }

  async function upload() {
    if (!docFile) return toast.error("Choose a file");
    setUploading(true);
    try {
      await uploadVendorDoc(vendor!.id, docType, docFile);
      toast.success("Document uploaded for verification");
      setDocFile(null);
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  }
  async function openDoc(path: string) {
    const url = await getSignedUrl("vendor-docs", path);
    if (url) window.open(url, "_blank"); else toast.error("Could not open file");
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
              <Button variant="outline" onClick={cancel} className="rounded-full"><X className="h-4 w-4 mr-1.5" /> Cancel</Button>
              <Button onClick={save} disabled={!isValid || busy} className="rounded-full bg-primary hover:bg-primary-deep">
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
              {editing ? <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl" /> : <ReadOnly value={vendor.name} />}
            </Field>
            <Field label="Contact Person" error={editing && errors.contactPerson}>
              {editing ? <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="h-11 rounded-xl" /> : <ReadOnly value={vendor.contactPerson} />}
            </Field>
            <Field label="Phone" error={editing && errors.phone}>
              {editing ? <Input inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} className="h-11 rounded-xl" /> : <ReadOnly value={vendor.phone} />}
            </Field>
            <Field label="Email" error={editing && errors.email}>
              {editing ? <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 rounded-xl" /> : <ReadOnly value={vendor.email} />}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address" error={editing && errors.address}>
                {editing ? <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-11 rounded-xl" /> : <ReadOnly value={vendor.address} />}
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-dashed bg-accent/30 p-4">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">Category and GST Number are locked. Contact the Maxxkart Admin to request changes.</p>
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
            {myOrders.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{o.poNumber}</p>
                  <p className="text-xs text-muted-foreground">{o.createdAt}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(o.total)}</p>
                  <StatusBadge status={o.status} className="mt-1" />
                </div>
              </li>
            ))}
            {myOrders.length === 0 && <li className="py-10 text-center text-muted-foreground text-sm">No orders yet</li>}
          </ul>
        </div>
      </div>

      <div className="card-soft p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Verification documents</h3>
          </div>
          <span className="text-xs text-muted-foreground">Upload GST certificate, PAN, business registration, or supporting docs. Admin will review each.</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto] items-end mb-6">
          <div>
            <Label>Document type</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
              <SelectTrigger className="h-11 rounded-xl mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>File</Label>
            <Input type="file" accept=".pdf,image/*" className="mt-1.5 h-11 rounded-xl cursor-pointer" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
          </div>
          <Button onClick={upload} disabled={!docFile || uploading} className="h-11 rounded-full bg-primary hover:bg-primary-deep">
            <Upload className="h-4 w-4 mr-1.5" /> Upload
          </Button>
        </div>

        {myDocs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No documents uploaded yet</p>
        ) : (
          <ul className="divide-y">
            {myDocs.map((d) => (
              <li key={d.id} className="py-3 flex items-center gap-3 flex-wrap">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-xs font-medium">{d.docType}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.fileName}</p>
                  <p className="text-xs text-muted-foreground">Uploaded {d.uploadedAt}</p>
                </div>
                <StatusBadge status={d.status === "Verified" ? "Approved" : d.status === "Rejected" ? "Rejected" : "Pending"} />
                <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => openDoc(d.filePath)}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> View
                </Button>
              </li>
            ))}
          </ul>
        )}
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
