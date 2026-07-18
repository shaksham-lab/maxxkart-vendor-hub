import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, CATEGORIES, type VendorStatus } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, ChevronRight, FileSpreadsheet, FileText } from "lucide-react";
import { exportExcel, exportPDF } from "@/lib/exports";

export const Route = createFileRoute("/admin/vendors")({
  component: Vendors,
});

function Vendors() {
  const { vendors } = useStore();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [status, setStatus] = useState<"all" | VendorStatus>("all");

  const filtered = vendors.filter((v) => {
    const q = query.toLowerCase();
    return (
      (!q || v.name.toLowerCase().includes(q) || v.contactPerson.toLowerCase().includes(q) || v.email.toLowerCase().includes(q)) &&
      (cat === "all" || v.category === cat) &&
      (status === "all" || v.status === status)
    );
  });

  const counts = {
    all: vendors.length,
    Pending: vendors.filter((v) => v.status === "Pending").length,
    Active: vendors.filter((v) => v.status === "Active").length,
    Rejected: vendors.filter((v) => v.status === "Rejected").length,
  };

  const exportRows = filtered.map((v) => ({
    Name: v.name, Category: v.category, Contact: v.contactPerson,
    Email: v.email, Phone: v.phone, GST: v.gst, Status: v.status, Address: v.address,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">All Vendors</h1>
          <p className="text-muted-foreground mt-1">Review registrations and manage your supplier network.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => exportExcel("vendors", exportRows)}>
            <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" /> Excel
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => exportPDF(
            "vendors", "Maxxkart Vendors",
            ["Name", "Category", "Contact", "Email", "Phone", "GST", "Status"],
            filtered.map((v) => [v.name, v.category, v.contactPerson, v.email, v.phone, v.gst, v.status]),
          )}>
            <FileText className="h-4 w-4 mr-1.5 text-red-600" /> PDF
          </Button>
        </div>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
        <TabsList className="rounded-full bg-accent/60 p-1">
          <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-white">All <span className="ml-1.5 text-xs text-muted-foreground">{counts.all}</span></TabsTrigger>
          <TabsTrigger value="Pending" className="rounded-full data-[state=active]:bg-white">Pending <span className="ml-1.5 text-xs text-amber-600">{counts.Pending}</span></TabsTrigger>
          <TabsTrigger value="Active" className="rounded-full data-[state=active]:bg-white">Active <span className="ml-1.5 text-xs text-emerald-600">{counts.Active}</span></TabsTrigger>
          <TabsTrigger value="Rejected" className="rounded-full data-[state=active]:bg-white">Rejected <span className="ml-1.5 text-xs text-red-600">{counts.Rejected}</span></TabsTrigger>
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
