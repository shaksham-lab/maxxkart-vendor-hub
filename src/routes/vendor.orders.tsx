import { createFileRoute } from "@tanstack/react-router";
import { useStore, formatCurrency, type PurchaseOrder } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { PackageCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/vendor/orders")({
  component: VendorOrders,
});

function VendorOrders() {
  const { orders, currentVendor, updatePOStatus } = useStore();
  const vendor = currentVendor;
  if (!vendor) return null;
  const myOrders = orders.filter((o) => o.vendorId === vendor.id);

  async function markDelivered(o: PurchaseOrder) {
    try { await updatePOStatus(o.id, "Delivered"); toast.success(`${o.poNumber} marked as delivered`); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground mt-1">Purchase orders assigned to {vendor.name}.</p>
      </div>

      <div className="grid gap-4">
        {myOrders.map((o) => (
          <div key={o.id} className="card-soft p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-lg">{o.poNumber}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">Created {o.createdAt}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-gradient-purple">{formatCurrency(o.total)}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {o.items.map((it, i) => (
                <div key={i} className="rounded-xl bg-accent/50 px-4 py-3">
                  <p className="font-medium text-sm">{it.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{it.qty} × {formatCurrency(it.price)} = {formatCurrency(it.qty * it.price)}</p>
                </div>
              ))}
            </div>
            {o.status === "Pending" && (
              <div className="mt-5 pt-5 border-t flex justify-end">
                <Button onClick={() => markDelivered(o)} className="rounded-full bg-primary hover:bg-primary-deep hover:shadow-glow">
                  <PackageCheck className="h-4 w-4 mr-2" /> Mark as Delivered
                </Button>
              </div>
            )}
          </div>
        ))}
        {myOrders.length === 0 && (
          <div className="card-soft p-16 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-purple-soft flex items-center justify-center mb-4">
              <PackageCheck className="h-7 w-7 text-primary-deep" />
            </div>
            <p className="font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1">New purchase orders will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
