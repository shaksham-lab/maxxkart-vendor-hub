import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Mail, Shield, Store, User } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { user, currentVendor, signOut } = useStore();
  const navigate = useNavigate();
  if (!user) return null;

  const display = currentVendor?.name ?? user.email;
  const initial = display[0]?.toUpperCase() ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account details"
          className="h-9 w-9 rounded-full bg-gradient-purple text-white flex items-center justify-center text-sm font-semibold ring-offset-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2">
        <div className="rounded-xl bg-accent/60 p-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-purple text-white flex items-center justify-center font-semibold">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{display}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-3.5 w-3.5" /> Role
              <span className="ml-auto font-medium capitalize text-foreground">{user.role ?? "unassigned"}</span>
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> Email
              <span className="ml-auto max-w-[10rem] truncate font-medium text-foreground">{user.email}</span>
            </p>
            {currentVendor && (
              <>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Store className="h-3.5 w-3.5" /> Category
                  <span className="ml-auto font-medium text-foreground">{currentVendor.category}</span>
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> Status
                  <span className="ml-auto font-medium text-foreground">{currentVendor.status}</span>
                </p>
              </>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />
        {user.role === "vendor" ? (
          <DropdownMenuItem asChild className="rounded-xl">
            <Link to="/vendor/profile"><User className="h-4 w-4" /> My Profile</Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild className="rounded-xl">
            <Link to="/admin/documents"><Shield className="h-4 w-4" /> Document Verification</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="rounded-xl text-red-600 focus:text-red-600"
          onSelect={async () => { await signOut(); navigate({ to: "/login" }); }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
