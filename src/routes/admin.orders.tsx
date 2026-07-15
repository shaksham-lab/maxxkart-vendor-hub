import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { useStore, formatCurrency, type POItem, type PurchaseOrder } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  component: Orders,
});

function Orders() {
  const { db, update } = useStore();
  const [open, setOpen] = useState(false);
  const [vendorId, setVendorId] = useState<string>(db.vendors[0]?.id ?? "");
  const [items, setItems] = useState<POItem[]>([{ name: "", qty: 1, price: 0 }]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  function addItem() { setItems([...items, { name: "", qty: 1, price: 0 }]); }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, patch: Partial<POItem>) {
    setItems(items.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  }

  function save() {
    if (!vendorId) return toast.error("Select a vendor");
    if (items.some((i) => !i.name || i.qty <= 0 || i.price <= 0)) return toast.error("Fill all item rows");
    update((d) => {
      const nextNum = 1000 + d.orders.length + 1;
      d.orders.push({
        id: `PO-${nextNum}`,
        vendorId,
        items,
        total,
        status: "Pending",
        createdAt: new Date().toISOString().slice(0, 10),
      });
      return d;
    });
    toast.success("Purchase order created");
    setOpen(false);
    setItems([{ name: "", qty: 1, price: 0 }]);
  }

  function advance(o: PurchaseOrder) {
    const next = o.status === "Pending" ? "Delivered" : "Completed";
    update((d) => { d.orders = d.orders.map((x) => x.id === o.id ? { ...x, status: next as PurchaseOrder["status"] } : x); return d; });
    toast.success(`Marked as ${next}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Create and track POs across vendors.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="rounded-full bg-primary hover:bg-primary-deep hover:shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> New PO
        </Button>
      </div>

      <div className="card-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-accent/60 text-accent-foreground sticky top-0">
            <tr className="text-left">
              <th className="px-5 py-3 font-medium">PO #</th>
              <th className="px-5 py-3 font-medium">Vendor</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {db.orders.map((o, i) => {
              const v = db.vendors.find((x) => x.id === o.vendorId);
              const isExp = expanded === o.id;
              return (
                <React.Fragment key={o.id}>
                  <tr className={`border-t border-border/60 hover:bg-accent/30 transition ${i % 2 ? "bg-accent/10" : ""}`}>

                    <td className="px-5 py-3.5 font-mono font-medium">{o.id}</td>
                    <td className="px-5 py-3.5">{v?.name}</td>
                    <td className="px-5 py-3.5">
                      <button className="inline-flex items-center gap-1 text-primary hover:underline" onClick={() => setExpanded(isExp ? null : o.id)}>
                        {o.items.length} item{o.items.length > 1 ? "s" : ""}
                        {isExp ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 font-semibold">{formatCurrency(o.total)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{o.createdAt}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      {o.status !== "Completed" ? (
                        <Button size="sm" variant="outline" onClick={() => advance(o)} className="rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Mark {o.status === "Pending" ? "Delivered" : "Completed"}
                        </Button>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                  {isExp && (
                    <tr className="bg-accent/20">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="grid grid-cols-3 gap-3">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="rounded-xl bg-white p-3 border">
                              <p className="font-medium">{it.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{it.qty} × {formatCurrency(it.price)}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader><DialogTitle>Create purchase order</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{db.vendors.filter((v) => v.active).map((v) => <SelectItem key={v.id} value={v.id}>{v.name} · {v.category}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items</Label>
                <Button size="sm" variant="ghost" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" /> Add item</Button>
              </div>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <Input className="col-span-6" placeholder="Item name" value={it.name} onChange={(e) => updateItem(i, { name: e.target.value })} />
                    <Input className="col-span-2" type="number" min={1} placeholder="Qty" value={it.qty || ""} onChange={(e) => updateItem(i, { qty: +e.target.value })} />
                    <Input className="col-span-3" type="number" min={0} placeholder="Price" value={it.price || ""} onChange={(e) => updateItem(i, { price: +e.target.value })} />
                    <button className="col-span-1 flex items-center justify-center text-muted-foreground hover:text-red-500" onClick={() => removeItem(i)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-accent/60 p-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold text-gradient-purple">{formatCurrency(total)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={save} className="rounded-full bg-primary hover:bg-primary-deep">Create PO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
