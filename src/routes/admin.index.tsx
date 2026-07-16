import { createFileRoute } from "@tanstack/react-router";
import { useStore, formatCurrency, CATEGORIES } from "@/lib/store";
import { Users, ClipboardList, Wallet, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { db } = useStore();
  const totalVendors = db.vendors.filter((v) => v.status === "Active").length;
  const activePOs = db.orders.filter((o) => o.status !== "Completed").length;
  const pendingPayments = db.invoices.filter((i) => i.payment === "Pending").reduce((s, i) => s + i.amount, 0);
  const monthSpend = db.orders.reduce((s, o) => s + o.total, 0);

  const spendByCategory = CATEGORIES.map((cat) => {
    const vendorIds = db.vendors.filter((v) => v.category === cat).map((v) => v.id);
    const spend = db.orders.filter((o) => vendorIds.includes(o.vendorId)).reduce((s, o) => s + o.total, 0);
    return { category: cat, spend };
  });

  const recent = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const barColors = ["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#4C1D95"];

  const stats = [
    { label: "Active Vendors", value: totalVendors, icon: Users, tint: "from-violet-500 to-fuchsia-500" },
    { label: "Active POs", value: activePOs, icon: ClipboardList, tint: "from-purple-500 to-violet-600" },
    { label: "Pending Payments", value: formatCurrency(pendingPayments), icon: Wallet, tint: "from-fuchsia-500 to-purple-600" },
    { label: "This Month Spend", value: formatCurrency(monthSpend), icon: TrendingUp, tint: "from-indigo-500 to-purple-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-purple p-8 text-white shadow-glow">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="relative">
          <p className="text-sm text-white/70">Overview</p>
          <h1 className="mt-1 text-3xl font-bold">Good day — here's what's happening at Maxxkart</h1>
          <p className="mt-2 text-white/80">Track vendors, orders and payments across the supermarket in one place.</p>
        </div>
      </div>

      {/* Stat cards */}
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

      {/* Chart + recent */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">Spend by category</h3>
              <p className="text-sm text-muted-foreground">Purchase totals across vendor categories</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={spendByCategory}>
                <XAxis dataKey="category" tickLine={false} axisLine={false} stroke="#6B7280" fontSize={12} />
                <YAxis tickLine={false} axisLine={false} stroke="#6B7280" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  cursor={{ fill: "rgba(124,58,237,0.06)" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid #EDE9FE", boxShadow: "0 8px 24px -12px rgba(76,29,149,0.2)" }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Bar dataKey="spend" radius={[8, 8, 0, 0]}>
                  {spendByCategory.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-soft p-6">
          <h3 className="font-semibold text-lg mb-1">Recent activity</h3>
          <p className="text-sm text-muted-foreground mb-4">Latest purchase orders</p>
          <ul className="space-y-3">
            {recent.map((o) => {
              const v = db.vendors.find((x) => x.id === o.vendorId);
              return (
                <li key={o.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition">
                  <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center text-accent-foreground text-xs font-semibold">
                    {v?.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{o.id} · {v?.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(o.total)} · {o.createdAt}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
