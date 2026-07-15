import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatCurrency } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/vendor/invoices")({
  component: VendorInvoices,
});

function VendorInvoices() {
  const { db, update, currentVendor } = useStore();
  const [open, setOpen] = useState(false);
  const [poId, setPoId] = useState("");
  const [fileName, setFileName] = useState("");
  const vendor = currentVendor();
  if (!vendor) return null;

  const myInvoices = db.invoices.filter((i) => i.vendorId === vendor.id);
  const eligiblePOs = db.orders.filter((o) => o.vendorId === vendor.id && o.status === "Delivered" && !db.invoices.some((i) => i.poId === o.id));

  const submit = () => {
    if (!poId) return toast.error("Select a delivered PO");
    if (!fileName) return toast.error("Choose a file");
    const vId = vendor.id;
    const po = db.orders.find((o) => o.id === poId)!;
    update((d) => {
      d.invoices.push({
        id: `INV-${9000 + d.invoices.length + 1}`,
        poId,
        vendorId: vId,
        fileName,
        amount: po.total,
        status: "Pending Review",
        payment: "Pending",
        uploadedAt: new Date().toISOString().slice(0, 10),
      });
      return d;
    });
    toast.success("Invoice uploaded — awaiting admin review");
    setOpen(false); setPoId(""); setFileName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">Upload invoices and track payment status.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="rounded-full bg-primary hover:bg-primary-deep hover:shadow-glow" disabled={eligiblePOs.length === 0}>
          <Upload className="h-4 w-4 mr-2" /> Upload invoice
        </Button>
      </div>

      {eligiblePOs.length === 0 && myInvoices.length > 0 && (
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
                      <div className="font-mono font-medium">{inv.id}</div>
                      <div className="text-xs text-muted-foreground">{inv.fileName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono">{inv.poId}</td>
                <td className="px-5 py-3.5 font-semibold">{formatCurrency(inv.amount)}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{inv.uploadedAt}</td>
                <td className="px-5 py-3.5"><StatusBadge status={inv.status} /></td>
                <td className="px-5 py-3.5"><StatusBadge status={inv.payment} /></td>
              </tr>
            ))}
            {myInvoices.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">No invoices uploaded yet</td></tr>
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
                  {eligiblePOs.map((o) => <SelectItem key={o.id} value={o.id}>{o.id} · {formatCurrency(o.total)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Invoice file</Label>
              <div className="rounded-xl border-2 border-dashed p-6 text-center bg-accent/30">
                <Upload className="h-6 w-6 mx-auto text-primary" />
                <p className="text-sm mt-2 font-medium">{fileName || "Drop file or click to browse"}</p>
                <Input type="file" accept=".pdf,image/*" className="mt-3 cursor-pointer" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={submit} className="rounded-full bg-primary hover:bg-primary-deep">Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
