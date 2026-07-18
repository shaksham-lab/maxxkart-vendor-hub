import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatCurrency, type DocumentStatus } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Building2, Mail, Phone, MapPin, Check, X, ClipboardList, FileCheck2, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/vendors/$id")({
  component: VendorDetail,
});

function VendorDetail() {
  const { id } = Route.useParams();
  const { vendors, orders, documents, setVendorStatus, setDocumentStatus, getSignedUrl } = useStore();
  const navigate = useNavigate();
  const vendor = vendors.find((v) => v.id === id);
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!vendor) {
    return (
      <div className="card-soft p-10 text-center">
        <p className="text-muted-foreground">Vendor not found.</p>
        <Link to="/admin/vendors" className="mt-4 inline-flex items-center gap-1 text-primary hover:text-primary-deep">
          <ArrowLeft className="h-4 w-4" /> Back to vendors
        </Link>
      </div>
    );
  }

  const vendorOrders = orders.filter((o) => o.vendorId === vendor.id);
  const vendorDocs = documents.filter((d) => d.vendorId === vendor.id);

  async function approve() {
    setBusy(true);
    try { await setVendorStatus(vendor!.id, "Active"); toast.success(`${vendor!.name} approved`); }
    catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function reject() {
    setBusy(true);
    try {
      await setVendorStatus(vendor!.id, "Rejected", reason.trim() || undefined);
      toast.success("Vendor rejected"); setShowReject(false); setReason("");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function reviewDoc(docId: string, status: DocumentStatus) {
    try { await setDocumentStatus(docId, status); toast.success(`Document ${status.toLowerCase()}`); }
    catch (e: any) { toast.error(e.message); }
  }
  async function openDoc(path: string) {
    const url = await getSignedUrl("vendor-docs", path);
    if (url) window.open(url, "_blank");
    else toast.error("Could not open file");
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate({ to: "/admin/vendors" })} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All vendors
      </button>

      <div className="card-soft p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-purple text-white flex items-center justify-center text-xl font-semibold">
              {vendor.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{vendor.name}</h1>
              <p className="text-muted-foreground">{vendor.category} · {vendor.contactPerson}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={vendor.status} />
            {vendor.status === "Pending" && (
              <>
                <Button onClick={approve} disabled={busy} className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="h-4 w-4 mr-1.5" /> Approve
                </Button>
                <Button variant="outline" onClick={() => setShowReject((s) => !s)} className="rounded-full border-red-200 text-red-600 hover:bg-red-50">
                  <X className="h-4 w-4 mr-1.5" /> Reject
                </Button>
              </>
            )}
            {vendor.status === "Rejected" && (
              <Button onClick={approve} disabled={busy} className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <Check className="h-4 w-4 mr-1.5" /> Approve anyway
              </Button>
            )}
          </div>
        </div>

        {showReject && vendor.status === "Pending" && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50/60 p-4">
            <p className="text-sm font-medium text-red-700">Reject registration</p>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="e.g. GST could not be verified" className="mt-2 bg-white" />
            <div className="mt-3 flex gap-2">
              <Button onClick={reject} disabled={busy} className="rounded-full bg-red-600 hover:bg-red-700 text-white">Confirm reject</Button>
              <Button variant="outline" onClick={() => setShowReject(false)} className="rounded-full">Cancel</Button>
            </div>
          </div>
        )}
        {vendor.status === "Rejected" && vendor.rejectionReason && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50/60 p-4 text-sm">
            <span className="font-medium text-red-700">Rejection reason: </span>
            <span className="text-red-700/90">{vendor.rejectionReason}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-soft p-6 space-y-4">
          <h3 className="font-semibold">Contact details</h3>
          <Row icon={Building2} label="Business" value={vendor.name} />
          <Row icon={Mail} label="Email" value={vendor.email} />
          <Row icon={Phone} label="Phone" value={vendor.phone} />
          <Row icon={MapPin} label="Address" value={vendor.address} />
          <div className="rounded-xl bg-accent/60 p-3">
            <p className="text-xs text-muted-foreground">GST Number</p>
            <p className="font-mono font-medium">{vendor.gst}</p>
          </div>
        </div>

        <div className="lg:col-span-2 card-soft p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Documents ({vendorDocs.length})</h3>
          </div>
          {vendorDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No documents uploaded yet</p>
          ) : (
            <ul className="divide-y">
              {vendorDocs.map((d) => (
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
                  {d.status === "Pending" && (
                    <>
                      <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => reviewDoc(d.id, "Verified")}>
                        <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Verify
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => reviewDoc(d.id, "Rejected")}>
                        <X className="h-3.5 w-3.5 mr-1 text-red-500" /> Reject
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card-soft p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Purchase orders ({vendorOrders.length})</h3>
        </div>
        <ul className="divide-y">
          {vendorOrders.map((o) => (
            <li key={o.id} className="flex items-center gap-3 py-3">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center text-xs font-mono font-semibold text-accent-foreground">
                {o.poNumber.split("-")[1]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{o.poNumber}</p>
                <p className="text-xs text-muted-foreground">{o.items.length} items · {o.createdAt}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{formatCurrency(o.total)}</p>
                <StatusBadge status={o.status} className="mt-1" />
              </div>
            </li>
          ))}
          {vendorOrders.length === 0 && <li className="py-10 text-center text-muted-foreground text-sm">No purchase orders yet</li>}
        </ul>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-accent-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium break-words">{value}</p>
      </div>
    </div>
  );
}
