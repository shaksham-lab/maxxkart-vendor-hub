import { createFileRoute } from "@tanstack/react-router";
import { useStore, formatCurrency, CATEGORIES } from "@/lib/store";
import { Users, ClipboardList, Wallet, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LineChart, Line, CartesianGrid, PieChart, Pie, Legend } from "recharts";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { vendors, orders, invoices } = useStore();
  const totalVendors = vendors.filter((v) => v.status === "Active").length;
  const activePOs = orders.filter((o) => o.status !== "Completed").length;
  const pendingPayments = invoices.filter((i) => i.payment === "Pending").reduce((s, i) => s + i.amount, 0);
  const monthSpend = orders.reduce((s, o) => s + o.total, 0);

  const spendByCategory = CATEGORIES.map((cat) => {
    const vendorIds = vendors.filter((v) => v.category === cat).map((v) => v.id);
    const spend = orders.filter((o) => vendorIds.includes(o.vendorId)).reduce((s, o) => s + o.total, 0);
    return { category: cat, spend };
  });

  // 6-month trend
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: d.toLocaleString("en-US", { month: "short" }) };
  });
  const trend = months.map((m) => ({
    month: m.label,
    orders: orders.filter((o) => o.createdAt.startsWith(m.key)).reduce((s, o) => s + o.total, 0),
    paid: invoices.filter((i) => i.payment === "Paid" && i.uploadedAt.startsWith(m.key)).reduce((s, i) => s + i.amount, 0),
  }));

  const statusData = [
    { name: "Pending", value: orders.filter((o) => o.status === "Pending").length, color: "#F59E0B" },
    { name: "Delivered", value: orders.filter((o) => o.status === "Delivered").length, color: "#8B5CF6" },
    { name: "Completed", value: orders.filter((o) => o.status === "Completed").length, color: "#10B981" },
  ];

  const recent = [...orders].slice(0, 5);
  const barColors = ["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#4C1D95"];

  const stats = [
    { label: "Active Vendors", value: totalVendors, icon: Users, tint: "from-violet-500 to-fuchsia-500" },
    { label: "Active POs", value: activePOs, icon: ClipboardList, tint: "from-purple-500 to-violet-600" },
    { label: "Pending Payments", value: formatCurrency(pendingPayments), icon: Wallet, tint: "from-fuchsia-500 to-purple-600" },
    { label: "Total Spend", value: formatCurrency(monthSpend), icon: TrendingUp, tint: "from-indigo-500 to-purple-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-purple p-8 text-white shadow-glow">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="relative">
          <p className="text-sm text-white/70">Overview</p>
          <h1 className="mt-1 text-3xl font-bold">Good day — here's what's happening at Maxxkart</h1>
          <p className="mt-2 text-white/80">Track vendors, orders and payments across the supermarket in one place.</p>
        </div>
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
        <div className="lg:col-span-2 card-soft p-6">
          <h3 className="font-semibold text-lg">Spend by category</h3>
          <p className="text-sm text-muted-foreground mb-6">Purchase totals across vendor categories</p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={spendByCategory}>
                <XAxis dataKey="category" tickLine={false} axisLine={false} stroke="#6B7280" fontSize={12} />
                <YAxis tickLine={false} axisLine={false} stroke="#6B7280" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip cursor={{ fill: "rgba(124,58,237,0.06)" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid #EDE9FE" }}
                  formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="spend" radius={[8, 8, 0, 0]}>
                  {spendByCategory.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-soft p-6">
          <h3 className="font-semibold text-lg">PO status mix</h3>
          <p className="text-sm text-muted-foreground mb-4">Distribution across all POs</p>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3}>
                  {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card-soft p-6">
          <h3 className="font-semibold text-lg">6-month spend trend</h3>
          <p className="text-sm text-muted-foreground mb-4">Orders vs. paid invoices</p>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE9FE" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid #EDE9FE" }} />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="paid" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-soft p-6">
          <h3 className="font-semibold text-lg mb-1">Recent activity</h3>
          <p className="text-sm text-muted-foreground mb-4">Latest purchase orders</p>
          <ul className="space-y-3">
            {recent.map((o) => {
              const v = vendors.find((x) => x.id === o.vendorId);
              return (
                <li key={o.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition">
                  <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center text-accent-foreground text-xs font-semibold">
                    {v?.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{o.poNumber} · {v?.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(o.total)} · {o.createdAt}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </li>
              );
            })}
            {recent.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No orders yet</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
