import { createFileRoute } from "@tanstack/react-router";
import { useStore, formatCurrency, type Invoice } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { FileText, Check, X, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/invoices")({
  component: Invoices,
});

function Invoices() {
  const { db, update } = useStore();

  function setInvoiceStatus(inv: Invoice, status: Invoice["status"]) {
    update((d) => { d.invoices = d.invoices.map((x) => x.id === inv.id ? { ...x, status } : x); return d; });
    toast.success(`Invoice ${status.toLowerCase()}`);
  }
  function markPaid(inv: Invoice) {
    update((d) => {
      d.invoices = d.invoices.map((x) => x.id === inv.id ? { ...x, payment: "Paid" } : x);
      d.orders = d.orders.map((o) => o.id === inv.poId ? { ...o, status: "Completed" } : o);
      return d;
    });
    toast.success("Payment marked as Paid");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Invoices & Payments</h1>
        <p className="text-muted-foreground mt-1">Review vendor invoices and settle payments.</p>
      </div>

      <div className="card-soft overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Invoices</h3>
          <span className="text-xs text-muted-foreground">{db.invoices.length} total</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-accent/60 text-accent-foreground">
            <tr className="text-left">
              <th className="px-5 py-3 font-medium">Invoice</th>
              <th className="px-5 py-3 font-medium">PO</th>
              <th className="px-5 py-3 font-medium">Vendor</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Uploaded</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {db.invoices.map((inv, i) => {
              const v = db.vendors.find((x) => x.id === inv.vendorId);
              return (
                <tr key={inv.id} className={`border-t border-border/60 hover:bg-accent/30 ${i % 2 ? "bg-accent/10" : ""}`}>
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
                  <td className="px-5 py-3.5">{v?.name}</td>
                  <td className="px-5 py-3.5 font-semibold">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{inv.uploadedAt}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={inv.payment} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      {inv.status === "Pending Review" && (
                        <>
                          <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => setInvoiceStatus(inv, "Approved")}>
                            <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => setInvoiceStatus(inv, "Rejected")}>
                            <X className="h-3.5 w-3.5 mr-1 text-red-500" /> Reject
                          </Button>
                        </>
                      )}
                      {inv.status === "Approved" && inv.payment === "Pending" && (
                        <Button size="sm" className="rounded-full h-8 bg-primary hover:bg-primary-deep" onClick={() => markPaid(inv)}>
                          <Wallet className="h-3.5 w-3.5 mr-1" /> Mark Paid
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card-soft overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold">Payment history</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-accent/60 text-accent-foreground">
            <tr className="text-left">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Vendor</th>
              <th className="px-5 py-3 font-medium">Invoice</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {db.invoices.filter((i) => i.payment === "Paid").map((inv, i) => {
              const v = db.vendors.find((x) => x.id === inv.vendorId);
              return (
                <tr key={inv.id} className={`border-t border-border/60 ${i % 2 ? "bg-accent/10" : ""}`}>
                  <td className="px-5 py-3.5 text-muted-foreground">{inv.uploadedAt}</td>
                  <td className="px-5 py-3.5">{v?.name}</td>
                  <td className="px-5 py-3.5 font-mono">{inv.id}</td>
                  <td className="px-5 py-3.5 font-semibold">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status="Paid" /></td>
                </tr>
              );
            })}
            {db.invoices.filter((i) => i.payment === "Paid").length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No payments yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
