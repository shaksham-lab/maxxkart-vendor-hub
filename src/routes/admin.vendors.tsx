import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, CATEGORIES, type Vendor } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Pencil, Power, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/vendors")({
  component: Vendors,
});

const empty: Omit<Vendor, "id"> = { name: "", contactPerson: "", phone: "", email: "", category: "Groceries", address: "", gst: "", active: true };

function Vendors() {
  const { db, update } = useStore();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState<Omit<Vendor, "id">>(empty);

  const filtered = db.vendors.filter((v) => {
    const q = query.toLowerCase();
    return (
      (!q || v.name.toLowerCase().includes(q) || v.contactPerson.toLowerCase().includes(q) || v.email.toLowerCase().includes(q)) &&
      (cat === "all" || v.category === cat) &&
      (status === "all" || (status === "active" ? v.active : !v.active))
    );
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(v: Vendor) { setEditing(v); setForm({ ...v }); setOpen(true); }

  function save() {
    if (!form.name || !form.email) return toast.error("Name and email are required");
    update((d) => {
      if (editing) {
        d.vendors = d.vendors.map((v) => v.id === editing.id ? { ...editing, ...form } : v);
      } else {
        d.vendors.push({ id: `v${Date.now()}`, ...form });
      }
      return d;
    });
    toast.success(editing ? "Vendor updated" : "Vendor added");
    setOpen(false);
  }

  function toggleActive(v: Vendor) {
    update((d) => { d.vendors = d.vendors.map((x) => x.id === v.id ? { ...x, active: !x.active } : x); return d; });
    toast.success(v.active ? "Vendor deactivated" : "Vendor activated");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-muted-foreground mt-1">Manage your supplier network.</p>
        </div>
        <Button onClick={openNew} className="rounded-full bg-primary hover:bg-primary-deep hover:shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> Add Vendor
        </Button>
      </div>

      <div className="card-soft p-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, contact, email…" className="pl-10 h-10 rounded-full" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-44 h-10 rounded-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36 h-10 rounded-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="card-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-accent/60 text-accent-foreground sticky top-0">
            <tr className="text-left">
              <th className="px-5 py-3 font-medium">Vendor</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Contact</th>
              <th className="px-5 py-3 font-medium">GST</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => (
              <tr key={v.id} className={`border-t border-border/60 hover:bg-accent/30 transition ${i % 2 ? "bg-accent/10" : ""}`}>
                <td className="px-5 py-3.5">
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs text-muted-foreground">{v.address}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                    {v.category}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div>{v.contactPerson}</div>
                  <div className="text-xs text-muted-foreground">{v.email} · {v.phone}</div>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs">{v.gst}</td>
                <td className="px-5 py-3.5"><StatusBadge status={v.active ? "Active" : "Inactive"} /></td>
                <td className="px-5 py-3.5 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-accent transition" title="Edit">
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => toggleActive(v)} className="p-2 rounded-lg hover:bg-accent transition" title={v.active ? "Deactivate" : "Activate"}>
                      <Power className={`h-4 w-4 ${v.active ? "text-red-500" : "text-emerald-500"}`} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">No vendors match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit vendor" : "Add vendor"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Person</Label>
              <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>GST Number</Label>
              <Input value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={save} className="rounded-full bg-primary hover:bg-primary-deep">{editing ? "Save" : "Add vendor"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
