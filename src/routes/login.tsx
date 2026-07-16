import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Role } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShoppingBag, Sparkles, ShieldCheck, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Maxxkart Vendor Management" },
      { name: "description", content: "Sign in to the Maxxkart vendor management workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, signup, db } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("admin@ad.com");
  const [password, setPassword] = useState("Admin_123");
  const [role, setRole] = useState<Role>("vendor");

  function afterAuth(r: Role) {
    navigate({ to: r === "admin" ? "/admin" : "/vendor" });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signin") {
      const u = login(email, password);
      if (!u) return toast.error("Invalid credentials");
      toast.success(`Welcome back, ${u.role === "admin" ? "Admin" : "Vendor"}`);
      afterAuth(u.role);
    } else {
      if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
        return toast.error("Email already registered");
      const vendorId = role === "vendor" ? db.vendors[0]?.id : undefined;
      const u = signup(email, password, role, vendorId);
      toast.success("Account created");
      afterAuth(u.role);
    }
  }

  function quickFill(kind: "admin" | "vendor") {
    if (kind === "admin") { setEmail("admin@ad.com"); setPassword("Admin_123"); }
    else { setEmail("vendor@vd.com"); setPassword("Vendor_123"); }
    setMode("signin");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left: gradient panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-white bg-gradient-purple overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Maxxkart</p>
            <p className="font-semibold">Vendor Management</p>
          </div>
        </div>

        <div className="relative space-y-8 max-w-md">
          <h1 className="text-5xl font-bold leading-[1.05]">
            One clean workspace for every vendor, order, and payment.
          </h1>
          <p className="text-white/80 text-lg">
            Onboard vendors, track purchase orders, review invoices and settle payments — all in a single, focused view.
          </p>
          <div className="grid gap-4">
            {[
              { icon: Sparkles, t: "Modern, distraction-free UI" },
              { icon: ShieldCheck, t: "Role-based access for staff & vendors" },
              { icon: TrendingUp, t: "Spend insights at a glance" },
            ].map(({ icon: Icon, t }) => (
              <div key={t} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span className="text-white/90">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Maxxkart Supermarket</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-purple flex items-center justify-center text-white">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Maxxkart</p>
              <p className="font-semibold">Vendor Management</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {mode === "signin" ? "Sign in to continue to your dashboard." : "Get started in seconds."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label>I am a</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["admin", "vendor"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`h-11 rounded-xl border text-sm font-medium capitalize transition-all ${
                        role === r ? "bg-primary text-primary-foreground border-primary shadow-glow" : "bg-background hover:bg-accent"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-11 rounded-xl bg-primary hover:bg-primary-deep transition-all hover:shadow-glow text-base font-semibold">
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed bg-accent/40 p-4 text-sm">
            <p className="font-medium text-accent-foreground">Try a demo account</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => quickFill("admin")} className="flex-1 rounded-lg bg-white/70 hover:bg-white px-3 py-2 text-left transition">
                <span className="block text-xs text-muted-foreground">Admin</span>
                <span className="block font-medium">admin@maxx.com</span>
              </button>
              <button onClick={() => quickFill("vendor")} className="flex-1 rounded-lg bg-white/70 hover:bg-white px-3 py-2 text-left transition">
                <span className="block text-xs text-muted-foreground">Vendor</span>
                <span className="block font-medium">vendor@maxx.com</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to Maxxkart?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
