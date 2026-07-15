import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  "Pending Review": "bg-amber-50 text-amber-700 ring-amber-200",
  Delivered: "bg-violet-50 text-violet-700 ring-violet-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Inactive: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        map[status] ?? "bg-muted text-muted-foreground ring-border",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", {
        "bg-amber-500": status === "Pending" || status === "Pending Review",
        "bg-violet-500": status === "Delivered",
        "bg-emerald-500": status === "Completed" || status === "Approved" || status === "Paid" || status === "Active",
        "bg-red-500": status === "Rejected",
        "bg-zinc-400": status === "Inactive",
      })} />
      {status}
    </span>
  );
}
