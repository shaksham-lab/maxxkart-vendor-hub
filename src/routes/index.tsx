import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { currentUser } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const u = currentUser();
    if (!u) navigate({ to: "/login" });
    else if (u.role === "admin") navigate({ to: "/admin" });
    else navigate({ to: "/vendor" });
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
