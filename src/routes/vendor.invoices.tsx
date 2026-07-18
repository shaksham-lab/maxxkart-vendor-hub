import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatCurrency } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Upload, FileText, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/vendor/invoices")({
  component: VendorInvoices,
});

function VendorInvoices() {
  const { orders, invoices, currentVendor, createInvoice, getSignedUrl } = useStore();
  const [open, setOpen] = useState(false);
  const [poId, setPoId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const vendor = currentVendor;
  if (!vendor) return null;

  const myInvoices = invoices.filter((i) => i.vendorId === vendor.id);
  const eligible = orders.filter((o) => o.vendorId === vendor.id && o.status === "Delivered" && !invoices.some((i) => i.poId === o.id));

  async function submit() {
    if (!poId) return toast.error("Select a delivered PO");
    if (!file) return toast.error("Choose a file");
    setBusy(true);
    try {
      await createInvoice({ poId, vendorId: vendor!.id, file });
      toast.success("Invoice uploaded — awaiting admin review");
      setOpen(false); setPoId(""); setFile(null);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }
  async function openInv(path: string) {
    const url = await getSignedUrl("invoices", path);
    if (url) window.open(url, "_blank"); else toast.error("Could not open file");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">Upload invoices and track payment status.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="rounded-full bg-primary hover:bg-primary-deep hover:shadow-glow" disabled={eligible.length === 0}>
          <Upload className="h-4 w-4 mr-2" /> Upload invoice
        </Button>
      </div>

      {eligible.length === 0 && myInvoices.length > 0 && (
        <div className="rounded-2xl border border-dashed bg-accent/30 p-4 text-sm text-muted-foreground">
          All delivered POs already have invoices. Mark more orders as delivered to upload new invoices.
        </div>
      )}

      <div className="card-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-accent/60 text-accent-foreground">
            <tr className="text-left">
              <th className="px-5 py-3 font-medium">Invoice</th>
              <th className="px-5 py-3 font-medium">Against PO</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Uploaded</th>
              <th className="px-5 py-3 font-medium">Review</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {myInvoices.map((inv, i) => (
              <tr key={inv.id} className={`border-t border-border/60 ${i % 2 ? "bg-accent/10" : ""}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                      <FileText className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <div className="font-mono font-medium">{inv.invoiceNumber}</div>
                      <div className="text-xs text-muted-foreground">{inv.fileName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono">{inv.poNumber}</td>
                <td className="px-5 py-3.5 font-semibold">{formatCurrency(inv.amount)}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{inv.uploadedAt}</td>
                <td className="px-5 py-3.5"><StatusBadge status={inv.status} /></td>
                <td className="px-5 py-3.5"><StatusBadge status={inv.payment} /></td>
                <td className="px-5 py-3.5 text-right">
                  <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => openInv(inv.filePath)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                </td>
              </tr>
            ))}
            {myInvoices.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">No invoices uploaded yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Upload invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Against Delivered PO</Label>
              <Select value={poId} onValueChange={setPoId}>
                <SelectTrigger><SelectValue placeholder="Select a PO" /></SelectTrigger>
                <SelectContent>
                  {eligible.map((o) => <SelectItem key={o.id} value={o.id}>{o.poNumber} · {formatCurrency(o.total)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Invoice file</Label>
              <div className="rounded-xl border-2 border-dashed p-6 text-center bg-accent/30">
                <Upload className="h-6 w-6 mx-auto text-primary" />
                <p className="text-sm mt-2 font-medium">{file?.name || "Drop file or click to browse"}</p>
                <Input type="file" accept=".pdf,image/*" className="mt-3 cursor-pointer" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={submit} disabled={busy} className="rounded-full bg-primary hover:bg-primary-deep">Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
