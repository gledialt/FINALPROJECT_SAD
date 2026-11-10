import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { accountPasswordSchema, canInvite, invitationSchema, residentialData } from "./account-rules";

async function assertActiveAdmin(context: { supabase: any; userId: string }) {
  const { data: role, error: roleError } = await context.supabase.rpc("get_my_role");
  const { data: profile, error: profileError } = await context.supabase.from("profiles").select("is_active").eq("id", context.userId).single();
  if (roleError || profileError || !canInvite(role, profile?.is_active === true)) throw new Error("Hanya admin aktif yang dapat melakukan ini.");
}

const inviteInput = invitationSchema.and(z.object({ password: accountPasswordSchema }));

/** Admin supplies the password. Never retain or return plaintext credentials. */
export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inviteInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertActiveAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: lookupError } = await supabaseAdmin.from("profiles").select("id").ilike("email", data.email).limit(1);
    if (lookupError) throw new Error("Tidak dapat memeriksa email pengguna.");
    if (existing?.length) throw new Error("Email sudah terdaftar. Ubah peran melalui daftar pengguna.");
    // Invite sends the new user an email (works with default auth templates); then set the admin-supplied password.
    const { data: created, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: "https://smart-wasteweb.lovable.app/beranda",
      data: { full_name: data.full_name, whatsapp: data.whatsapp, ...residentialData(data) },
    });
    if (error || !created.user) {
      throw new Error(error?.message ?? "Akun gagal dibuat.");
    }
    const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(created.user.id, {
      password: data.password,
      email_confirm: true,
    });
    if (pwError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error("Password akun gagal disimpan. Akun belum dibuat; coba kembali.");
    }
    const { error: roleError } = await supabaseAdmin.rpc("assign_created_account_role", { target_user_id: created.user.id, assigned_role: data.role });
    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error("Peran akun gagal disimpan. Akun belum dibuat; coba kembali.");
    }
    return { email: data.email, full_name: data.full_name };
  });

/** Admin permanently deletes another user's account (auth user, profile, role and history). Irreversible. */
export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertActiveAdmin(context);
    if (data.userId === context.userId) throw new Error("Anda tidak dapat menghapus akun sendiri.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target, error: targetError } = await supabaseAdmin.from("profiles").select("id, email, full_name").eq("id", data.userId).maybeSingle();
    if (targetError) throw new Error("Tidak dapat memeriksa akun pengguna.");
    if (!target) throw new Error("Pengguna tidak ditemukan atau sudah dihapus.");
    // Never leave the system without an active admin.
    const { data: targetRole } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId).maybeSingle();
    if (targetRole?.role === "admin") {
      const { data: admins, error: adminsError } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
      if (adminsError) throw new Error("Tidak dapat memeriksa daftar admin.");
      const otherIds = (admins ?? []).map((a) => a.user_id).filter((id) => id !== data.userId);
      const { count } = otherIds.length
        ? await supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).in("id", otherIds).eq("is_active", true)
        : { count: 0 };
      if (!count) throw new Error("Tidak dapat menghapus admin aktif terakhir.");
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error("Akun gagal dihapus.");
    // Profile normally cascades from auth.users; this is a safety net so no orphan row remains.
    const { error: cleanupError } = await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    if (cleanupError) throw new Error("Akun sudah dihapus, tetapi data profil belum dibersihkan. Coba kembali.");
    return { ok: true as const, email: target.email, full_name: target.full_name };
  });
