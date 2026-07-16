import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, CATEGORIES, type VendorStatus } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/vendors")({
  component: Vendors,
});

function Vendors() {
  const { db } = useStore();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [status, setStatus] = useState<"all" | VendorStatus>("all");

  const filtered = db.vendors.filter((v) => {
    const q = query.toLowerCase();
    return (
      (!q || v.name.toLowerCase().includes(q) || v.contactPerson.toLowerCase().includes(q) || v.email.toLowerCase().includes(q)) &&
      (cat === "all" || v.category === cat) &&
      (status === "all" || v.status === status)
    );
  });

  const counts = {
    all: db.vendors.length,
    Pending: db.vendors.filter((v) => v.status === "Pending").length,
    Active: db.vendors.filter((v) => v.status === "Active").length,
    Rejected: db.vendors.filter((v) => v.status === "Rejected").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Vendors</h1>
        <p className="text-muted-foreground mt-1">Review registrations and manage your supplier network.</p>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
        <TabsList className="rounded-full bg-accent/60 p-1">
          <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">All <span className="ml-1.5 text-xs text-muted-foreground">{counts.all}</span></TabsTrigger>
          <TabsTrigger value="Pending" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Pending <span className="ml-1.5 text-xs text-amber-600">{counts.Pending}</span></TabsTrigger>
          <TabsTrigger value="Active" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Active <span className="ml-1.5 text-xs text-emerald-600">{counts.Active}</span></TabsTrigger>
          <TabsTrigger value="Rejected" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Rejected <span className="ml-1.5 text-xs text-red-600">{counts.Rejected}</span></TabsTrigger>
        </TabsList>
      </Tabs>

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
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => (
              <tr key={v.id} className={`border-t border-border/60 hover:bg-accent/30 transition ${i % 2 ? "bg-accent/10" : ""}`}>
                <td className="px-5 py-3.5">
                  <Link to="/admin/vendors/$id" params={{ id: v.id }} className="font-medium hover:text-primary">{v.name}</Link>
                  <div className="text-xs text-muted-foreground">{v.address}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">{v.category}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div>{v.contactPerson}</div>
                  <div className="text-xs text-muted-foreground">{v.email} · {v.phone}</div>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs">{v.gst}</td>
                <td className="px-5 py-3.5"><StatusBadge status={v.status} /></td>
                <td className="px-5 py-3.5 text-right">
                  <Link to="/admin/vendors/$id" params={{ id: v.id }} className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-deep">
                    View <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">No vendors match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
