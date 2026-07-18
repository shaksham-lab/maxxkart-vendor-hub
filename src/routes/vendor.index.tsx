import { createFileRoute } from "@tanstack/react-router";
import { useStore, formatCurrency } from "@/lib/store";
import { StatusBadge } from "@/components/StatusBadge";
import { ClipboardList, CheckCircle2, Wallet, TrendingUp, Building2, Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/vendor/")({
  component: VendorDashboard,
});

function VendorDashboard() {
  const { orders, invoices, currentVendor } = useStore();
  const vendor = currentVendor;
  if (!vendor) return (
    <div className="card-soft p-10 text-center">
      <p className="text-muted-foreground">No vendor profile linked to your account.</p>
    </div>
  );

  const myOrders = orders.filter((o) => o.vendorId === vendor.id);
  const active = myOrders.filter((o) => o.status !== "Completed").length;
  const completed = myOrders.filter((o) => o.status === "Completed").length;
  const myInvoices = invoices.filter((i) => i.vendorId === vendor.id);
  const paid = myInvoices.filter((i) => i.payment === "Paid").reduce((s, i) => s + i.amount, 0);
  const pending = myInvoices.filter((i) => i.payment === "Pending").reduce((s, i) => s + i.amount, 0);

  const stats = [
    { label: "Active Orders", value: active, icon: ClipboardList, tint: "from-violet-500 to-purple-600" },
    { label: "Completed", value: completed, icon: CheckCircle2, tint: "from-emerald-500 to-teal-500" },
    { label: "Paid to date", value: formatCurrency(paid), icon: Wallet, tint: "from-purple-500 to-fuchsia-500" },
    { label: "Awaiting Payment", value: formatCurrency(pending), icon: TrendingUp, tint: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-purple p-8 text-white shadow-glow">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <p className="text-sm text-white/70">Vendor Portal</p>
        <h1 className="mt-1 text-3xl font-bold">Welcome, {vendor.contactPerson.split(" ")[0]}</h1>
        <p className="mt-2 text-white/80">Here's the latest on your orders and payments with Maxxkart.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card-soft p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-bold">{s.value}</p>
              </div>
              <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${s.tint} text-white flex items-center justify-center shadow-md`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-soft p-6">
          <h3 className="font-semibold text-lg">Your profile</h3>
          <p className="text-sm text-muted-foreground mb-5">On file with Maxxkart</p>
          <div className="space-y-3 text-sm">
            <Row icon={Building2} label="Company" value={`${vendor.name} · ${vendor.category}`} />
            <Row icon={Mail} label="Email" value={vendor.email} />
            <Row icon={Phone} label="Phone" value={vendor.phone} />
            <Row icon={MapPin} label="Address" value={vendor.address} />
            <div className="rounded-xl bg-accent/60 p-3 mt-3">
              <p className="text-xs text-muted-foreground">GST</p>
              <p className="font-mono font-medium">{vendor.gst}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card-soft p-6">
          <h3 className="font-semibold text-lg mb-1">Recent orders</h3>
          <p className="text-sm text-muted-foreground mb-4">Latest purchase orders assigned to you</p>
          <ul className="divide-y">
            {myOrders.slice(0, 5).map((o) => (
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
            {myOrders.length === 0 && <li className="py-10 text-center text-muted-foreground text-sm">No orders yet</li>}
          </ul>
        </div>
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
        <p className="font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
