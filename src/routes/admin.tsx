import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { LayoutDashboard, Users, ClipboardList, Receipt, ShoppingBag, LogOut, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/GlobalSearch";
import { UserMenu } from "@/components/UserMenu";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/vendors", label: "Vendors", icon: Users, exact: false },
  { to: "/admin/orders", label: "Purchase Orders", icon: ClipboardList, exact: false },
  { to: "/admin/invoices", label: "Invoices & Payments", icon: Receipt, exact: false },
  { to: "/admin/documents", label: "Documents", icon: ShieldCheck, exact: false },
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
        <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
          <div className="h-16 flex items-center px-4 lg:px-6 gap-3">
            <div className="lg:hidden flex items-center gap-2 shrink-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-purple text-white flex items-center justify-center">
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>
              <div className="leading-tight hidden sm:block">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Maxxkart</p>
                <p className="font-semibold text-sm">Admin</p>
              </div>
            </div>
            <GlobalSearch className="flex-1 max-w-md" />
            <UserMenu />
          </div>

          {/* Mobile navigation bar */}
          <nav className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {nav.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link key={item.to} to={item.to}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition",
                    active ? "bg-gradient-purple text-white shadow-glow" : "bg-accent/60 text-muted-foreground hover:text-foreground",
                  )}>
                  <item.icon className="h-3.5 w-3.5" /> {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
}
