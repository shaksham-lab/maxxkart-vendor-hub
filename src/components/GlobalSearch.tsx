import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Users, ClipboardList, Receipt } from "lucide-react";
import { useStore, formatCurrency } from "@/lib/store";
import { cn } from "@/lib/utils";

type Suggestion = {
  key: string;
  label: string;
  sub: string;
  group: "Vendors" | "Purchase Orders" | "Invoices";
  go: () => void;
};

export function GlobalSearch({ className }: { className?: string }) {
  const { vendors, orders, invoices } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? "Unknown vendor";

    const v: Suggestion[] = vendors
      .filter((x) =>
        x.name.toLowerCase().includes(q) ||
        x.contactPerson.toLowerCase().includes(q) ||
        x.email.toLowerCase().includes(q) ||
        x.category.toLowerCase().includes(q))
      .slice(0, 4)
      .map((x) => ({
        key: `v-${x.id}`,
        label: x.name,
        sub: `${x.category} · ${x.status}`,
        group: "Vendors",
        go: () => navigate({ to: "/admin/vendors/$id", params: { id: x.id } }),
      }));

    const o: Suggestion[] = orders
      .filter((x) => x.poNumber.toLowerCase().includes(q) || vendorName(x.vendorId).toLowerCase().includes(q))
      .slice(0, 4)
      .map((x) => ({
        key: `o-${x.id}`,
        label: x.poNumber,
        sub: `${vendorName(x.vendorId)} · ${formatCurrency(x.total)} · ${x.status}`,
        group: "Purchase Orders",
        go: () => navigate({ to: "/admin/orders" }),
      }));

    const i: Suggestion[] = invoices
      .filter((x) => x.invoiceNumber.toLowerCase().includes(q) || x.poNumber.toLowerCase().includes(q) || vendorName(x.vendorId).toLowerCase().includes(q))
      .slice(0, 4)
      .map((x) => ({
        key: `i-${x.id}`,
        label: x.invoiceNumber,
        sub: `${vendorName(x.vendorId)} · ${formatCurrency(x.amount)} · ${x.status}`,
        group: "Invoices",
        go: () => navigate({ to: "/admin/invoices" }),
      }));

    return [...v, ...o, ...i];
  }, [query, vendors, orders, invoices, navigate]);

  const pick = (s: Suggestion) => {
    s.go();
    setQuery("");
    setOpen(false);
  };

  let lastGroup = "";

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!suggestions.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % suggestions.length); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + suggestions.length) % suggestions.length); }
          if (e.key === "Enter") { e.preventDefault(); pick(suggestions[active]); }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search vendors, orders, invoices…"
        className="w-full h-10 pl-10 pr-4 rounded-full bg-muted/60 focus:bg-white focus:ring-2 focus:ring-primary/30 outline-none text-sm transition"
      />

      {open && query.trim() && (
        <div className="absolute z-50 mt-2 w-full max-h-[22rem] overflow-auto rounded-2xl border bg-white p-1.5 shadow-xl">
          {suggestions.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matches for “{query}”</p>
          )}
          {suggestions.map((s, idx) => {
            const header = s.group !== lastGroup ? s.group : null;
            lastGroup = s.group;
            const Icon = s.group === "Vendors" ? Users : s.group === "Purchase Orders" ? ClipboardList : Receipt;
            return (
              <div key={s.key}>
                {header && (
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{header}</p>
                )}
                <button
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => pick(s)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                    idx === active ? "bg-accent" : "hover:bg-accent/60",
                  )}
                >
                  <span className="h-8 w-8 shrink-0 rounded-lg bg-gradient-purple text-white flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{s.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{s.sub}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
