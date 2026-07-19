import { createServerFn } from "@tanstack/react-start";

export const seedAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const email = "hellt5409@gmail.com";
  const password = "Admin_123";

  // Try to find existing user
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users.find((u) => u.email?.toLowerCase() === email);

  let userId: string;
  if (existing) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    userId = existing.id;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Admin" },
    });
    if (error) throw new Error(error.message);
    userId = data.user.id;
  }

  // Ensure admin role
  await supabaseAdmin.from("user_roles").upsert(
    { user_id: userId, role: "admin" },
    { onConflict: "user_id,role" },
  );
  await supabaseAdmin.from("profiles").upsert({ id: userId, email, full_name: "Admin" });

  return { ok: true, userId, email };
});
