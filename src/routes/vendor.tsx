import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { LayoutDashboard, ClipboardList, Receipt, ShoppingBag, LogOut, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vendor")({
  component: VendorLayout,
});

const nav = [
  { to: "/vendor", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/vendor/orders", label: "My Orders", icon: ClipboardList },
  { to: "/vendor/invoices", label: "Invoices", icon: Receipt },
  { to: "/vendor/profile", label: "My Profile", icon: User },
];

function VendorLayout() {
  const { user, loading, currentVendor, signOut } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const vendor = currentVendor;

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (user.role !== "vendor") navigate({ to: "/admin" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (user.role !== "vendor") return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-purple text-white flex items-center justify-center">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Maxxkart</p>
              <p className="font-semibold text-sm">Vendor Portal</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {nav.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link key={item.to} to={item.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    active ? "bg-accent text-primary-deep" : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}>
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium truncate max-w-[180px]">{vendor?.name ?? user.email}</p>
              <p className="text-xs text-muted-foreground">{vendor?.category ?? "Vendor"}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-purple text-white flex items-center justify-center text-sm font-semibold">
              {(vendor?.name ?? user.email)[0].toUpperCase()}
            </div>
            <button onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
              className="p-2 rounded-full hover:bg-accent" title="Sign out">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8"><Outlet /></main>
    </div>
  );
}
