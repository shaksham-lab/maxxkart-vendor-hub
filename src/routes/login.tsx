import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore, CATEGORIES, type RegisterInput } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShoppingBag, Sparkles, ShieldCheck, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Maxxkart Vendor Management" },
      { name: "description", content: "Sign in or register as a vendor for Maxxkart." },
    ],
  }),
  component: LoginPage,
});

type Errors = Partial<Record<keyof RegisterInput, string>>;

const nameRe = /^[A-Za-z][A-Za-z\s.'&-]{1,99}$/;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^[0-9]{10}$/;
const gstRe = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;
const passwordRe = /^(?=.*[0-9]).{8,}$/;

function validate(f: RegisterInput): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = "Business name is required";
  else if (!nameRe.test(f.name.trim())) e.name = "Only letters and spaces are allowed";
  if (!f.contactPerson.trim()) e.contactPerson = "Contact person is required";
  else if (!nameRe.test(f.contactPerson.trim())) e.contactPerson = "Only letters and spaces are allowed";
  if (!f.email.trim()) e.email = "Email is required";
  else if (!emailRe.test(f.email.trim())) e.email = "Enter a valid email address";
  if (!f.phone.trim()) e.phone = "Phone is required";
  else if (!phoneRe.test(f.phone.trim())) e.phone = "Phone must be exactly 10 digits";
  if (!f.category) e.category = "Please choose a category";
  if (!f.address.trim()) e.address = "Address is required";
  else if (f.address.trim().length < 10) e.address = "Address must be at least 10 characters";
  if (!f.gst.trim()) e.gst = "GST number is required";
  else if (!gstRe.test(f.gst.trim().toUpperCase())) e.gst = "Enter a valid 15-character GST number";
  if (!f.password) e.password = "Password is required";
  else if (!passwordRe.test(f.password)) e.password = "At least 8 characters and 1 number";
  return e;
}

const emptyForm: RegisterInput = {
  name: "", contactPerson: "", phone: "", email: "", category: "", address: "", gst: "", password: "",
};

function LoginPage() {
  const { signIn, signUp, user, loading } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("admin@ad.com");
  const [password, setPassword] = useState("Admin_123");

  const [form, setForm] = useState<RegisterInput>(emptyForm);
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterInput, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => validate(form), [form]);
  const isValid = Object.keys(errors).length === 0;

  useEffect(() => {
    if (!loading && user?.role === "admin") navigate({ to: "/admin" });
    else if (!loading && user?.role === "vendor") navigate({ to: "/vendor" });
  }, [loading, user, navigate]);

  function setField<K extends keyof RegisterInput>(k: K, v: RegisterInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function blur(k: keyof RegisterInput) { setTouched((t) => ({ ...t, [k]: true })); }
  function showErr(k: keyof RegisterInput) { return (touched[k] || submitted) && errors[k]; }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await signIn(email, password);
    setBusy(false);
    if (!r.ok) {
      if (r.reason === "invalid") return toast.error("Invalid credentials");
      if (r.reason === "pending") return toast.warning("Your vendor account is awaiting Admin approval");
      if (r.reason === "rejected") return toast.error(r.rejectionReason ? `Registration rejected: ${r.rejectionReason}` : "Your vendor registration was rejected");
      if (r.reason === "unassigned") return toast.error("No role assigned to this account. Contact Admin.");
    } else {
      toast.success(`Welcome back, ${r.role === "admin" ? "Admin" : "Vendor"}`);
      navigate({ to: r.role === "admin" ? "/admin" : "/vendor" });
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    setBusy(true);
    const r = await signUp(form);
    setBusy(false);
    if (!r.ok) return toast.error(r.message);
    toast.success("Registration submitted — awaiting Admin approval. Check your email to confirm.", { duration: 6000 });
    setForm(emptyForm); setTouched({}); setSubmitted(false); setMode("signin");
    setEmail(form.email.trim().toLowerCase()); setPassword("");
  }

  function quickFill(kind: "admin" | "vendor") {
    if (kind === "admin") { setEmail("admin@ad.com"); setPassword("Admin_123"); }
    else { setEmail("vendor@vd.com"); setPassword("Vendor_123"); }
    setMode("signin");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
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
          <h1 className="text-5xl font-bold leading-[1.05]">One clean workspace for every vendor, order, and payment.</h1>
          <p className="text-white/80 text-lg">Register as a vendor, then track your orders, invoices and payments — all in a single, focused view.</p>
          <div className="grid gap-4">
            {[
              { icon: Sparkles, t: "Modern, distraction-free UI" },
              { icon: ShieldCheck, t: "Role-based access with secure backend" },
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

          <h2 className="text-3xl font-bold">{mode === "signin" ? "Welcome back" : "Register as a vendor"}</h2>
          <p className="mt-2 text-muted-foreground">
            {mode === "signin" ? "Sign in to continue to your dashboard." : "Complete the form — Admin will review your registration."}
          </p>

          {mode === "signin" ? (
            <form onSubmit={onSignIn} className="mt-8 space-y-5">
              <Field label="Email">
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Field label="Password">
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Button type="submit" disabled={busy} className="w-full h-11 rounded-xl bg-primary hover:bg-primary-deep transition-all hover:shadow-glow text-base font-semibold">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
              </Button>

              <div className="rounded-xl border border-dashed bg-accent/40 p-4 text-sm">
                <p className="font-medium text-accent-foreground">Demo credentials</p>
                <p className="text-xs text-muted-foreground mt-1">First-time setup: register these emails once — <code>admin@ad.com</code> is auto-assigned the Admin role.</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => quickFill("admin")} className="flex-1 rounded-lg bg-white/70 hover:bg-white px-3 py-2 text-left transition">
                    <span className="block text-xs text-muted-foreground">Admin</span>
                    <span className="block font-medium">admin@ad.com</span>
                  </button>
                  <button type="button" onClick={() => quickFill("vendor")} className="flex-1 rounded-lg bg-white/70 hover:bg-white px-3 py-2 text-left transition">
                    <span className="block text-xs text-muted-foreground">Vendor</span>
                    <span className="block font-medium">vendor@vd.com</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={onRegister} noValidate className="mt-8 space-y-4">
              <Field label="Business Name" error={showErr("name")}>
                <Input value={form.name} onBlur={() => blur("name")} onChange={(e) => setField("name", e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact Person" error={showErr("contactPerson")}>
                  <Input value={form.contactPerson} onBlur={() => blur("contactPerson")} onChange={(e) => setField("contactPerson", e.target.value)} className="h-11 rounded-xl" />
                </Field>
                <Field label="Phone" error={showErr("phone")}>
                  <Input inputMode="numeric" maxLength={10} value={form.phone} onBlur={() => blur("phone")} onChange={(e) => setField("phone", e.target.value.replace(/\D/g, ""))} className="h-11 rounded-xl" />
                </Field>
              </div>
              <Field label="Email" error={showErr("email")}>
                <Input type="email" value={form.email} onBlur={() => blur("email")} onChange={(e) => setField("email", e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Field label="Category" error={showErr("category")}>
                <Select value={form.category} onValueChange={(v) => { setField("category", v); blur("category"); }}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Address" error={showErr("address")}>
                <Input value={form.address} onBlur={() => blur("address")} onChange={(e) => setField("address", e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Field label="GST Number" error={showErr("gst")} hint="15-character GSTIN, e.g. 27ABCDE1234F1Z5">
                <Input value={form.gst} maxLength={15} onBlur={() => blur("gst")} onChange={(e) => setField("gst", e.target.value.toUpperCase())} className="h-11 rounded-xl font-mono" />
              </Field>
              <Field label="Password" error={showErr("password")} hint="Min 8 characters, at least 1 number">
                <Input type="password" value={form.password} onBlur={() => blur("password")} onChange={(e) => setField("password", e.target.value)} className="h-11 rounded-xl" />
              </Field>

              <div className="flex items-start gap-2 rounded-xl bg-accent/40 p-3 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Your account will be reviewed by a Maxxkart Admin. You'll be able to sign in once approved.</span>
              </div>

              <Button type="submit" disabled={!isValid || busy} className="w-full h-11 rounded-xl bg-primary hover:bg-primary-deep transition-all hover:shadow-glow text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit registration"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New vendor?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "signin" ? "Register here" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string | false | undefined; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
