import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { LayoutDashboard, Users, ClipboardList, Receipt, ShoppingBag, LogOut, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/vendors", label: "Vendors", icon: Users },
  { to: "/admin/orders", label: "Purchase Orders", icon: ClipboardList },
  { to: "/admin/invoices", label: "Invoices & Payments", icon: Receipt },
];

function AdminLayout() {
  const { user, loading, signOut } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (user.role !== "admin") navigate({ to: "/vendor" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (user.role !== "admin") return null;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-6 py-6 flex items-center gap-3 border-b border-sidebar-border/50">
          <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/60">Maxxkart</p>
            <p className="font-semibold">Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5",
                )}>
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
                {active && <span className="ml-auto h-2 w-2 rounded-full bg-primary shadow-glow" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border/50">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs text-white/60">Signed in as</p>
            <p className="truncate text-sm font-medium">{user.email}</p>
            <button onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
              className="mt-3 flex items-center gap-2 text-xs text-white/70 hover:text-white">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-white/70 backdrop-blur flex items-center px-6 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Search vendors, orders, invoices…"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-muted/60 focus:bg-white focus:ring-2 focus:ring-primary/30 outline-none text-sm transition" />
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-purple text-white flex items-center justify-center text-sm font-semibold">
            {user.email[0].toUpperCase()}
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
}
