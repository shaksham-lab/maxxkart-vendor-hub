import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type DocumentStatus } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, FileText, ExternalLink, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({
    meta: [
      { title: "Document Verification — Maxxkart Admin" },
      { name: "description", content: "Review, verify and reject vendor compliance documents submitted to Maxxkart." },
      { property: "og:title", content: "Document Verification — Maxxkart Admin" },
      { property: "og:description", content: "Review, verify and reject vendor compliance documents submitted to Maxxkart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Documents,
});

function Documents() {
  const { documents, vendors, setDocumentStatus, getSignedUrl } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DocumentStatus>("all");

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? "Unknown vendor";

  const filtered = documents.filter((d) => {
    const q = query.trim().toLowerCase();
    return (
      (!q || vendorName(d.vendorId).toLowerCase().includes(q) || d.fileName.toLowerCase().includes(q) || d.docType.toLowerCase().includes(q)) &&
      (status === "all" || d.status === status)
    );
  });

  const counts = {
    all: documents.length,
    Pending: documents.filter((d) => d.status === "Pending").length,
    Verified: documents.filter((d) => d.status === "Verified").length,
    Rejected: documents.filter((d) => d.status === "Rejected").length,
  };

  const open = async (path: string) => {
    const url = await getSignedUrl("vendor-docs", path);
    if (url) window.open(url, "_blank");
    else toast.error("This demo document has no stored file.");
  };

  const review = async (id: string, next: DocumentStatus) => {
    try {
      await setDocumentStatus(id, next);
      toast.success(`Document marked ${next.toLowerCase()}`);
    } catch {
      toast.error("Could not update the document");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Document Verification</h1>
        <p className="text-muted-foreground mt-1">Verify GST, PAN and registration documents submitted by vendors.</p>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
        <TabsList className="rounded-full bg-accent/60 p-1 flex-wrap h-auto">
          <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-white">All <span className="ml-1.5 text-xs text-muted-foreground">{counts.all}</span></TabsTrigger>
          <TabsTrigger value="Pending" className="rounded-full data-[state=active]:bg-white">Pending <span className="ml-1.5 text-xs text-amber-600">{counts.Pending}</span></TabsTrigger>
          <TabsTrigger value="Verified" className="rounded-full data-[state=active]:bg-white">Verified <span className="ml-1.5 text-xs text-emerald-600">{counts.Verified}</span></TabsTrigger>
          <TabsTrigger value="Rejected" className="rounded-full data-[state=active]:bg-white">Rejected <span className="ml-1.5 text-xs text-red-600">{counts.Rejected}</span></TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="card-soft p-4 sm:p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by vendor, document type or file…" className="pl-10 h-10 rounded-full" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((d) => (
          <div key={d.id} className="card-soft p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{d.docType}</p>
                <Link to="/admin/vendors/$id" params={{ id: d.vendorId }} className="text-xs text-primary hover:underline">
                  {vendorName(d.vendorId)}
                </Link>
              </div>
              <StatusBadge status={d.status} />
            </div>
            <p className="text-xs text-muted-foreground truncate">{d.fileName} · uploaded {d.uploadedAt}</p>
            {d.reviewerNotes && <p className="text-xs text-red-600">{d.reviewerNotes}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => open(d.filePath)}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View
              </Button>
              {d.status !== "Verified" && (
                <Button size="sm" className="rounded-full" onClick={() => review(d.id, "Verified")}>
                  <Check className="h-3.5 w-3.5 mr-1.5" /> Verify
                </Button>
              )}
              {d.status !== "Rejected" && (
                <Button size="sm" variant="outline" className="rounded-full text-red-600" onClick={() => review(d.id, "Rejected")}>
                  <X className="h-3.5 w-3.5 mr-1.5" /> Reject
                </Button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card-soft col-span-full p-16 text-center text-muted-foreground">No documents match your filters</div>
        )}
      </div>
    </div>
  );
}
