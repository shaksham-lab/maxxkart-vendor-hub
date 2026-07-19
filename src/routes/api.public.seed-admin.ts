import { createFileRoute } from "@tanstack/react-router";
import { seedAdmin } from "@/lib/seed-admin.functions";

export const Route = createFileRoute("/api/public/seed-admin")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const r = await seedAdmin();
          return new Response(JSON.stringify(r), { headers: { "content-type": "application/json" } });
        } catch (e: any) {
          return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { "content-type": "application/json" } });
        }
      },
    },
  },
});
