import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, Mail, Pencil, Phone, Search, Shield, Trash2, User, UserPlus, Users } from "lucide-react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { matchesQuery } from "@/components/search-box";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusBadge } from "@/components/common";
import { ROLE_LABEL, useMe, type AppRole } from "@/lib/session";
import { deleteUser, inviteUser } from "@/lib/users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/pengguna")({
  head: () => ({
    meta: [
      { title: "Kelola Pengguna — Smart Waste Management" },
      { name: "description", content: "Atur peran dan status aktif pengguna." },
      { property: "og:title", content: "Kelola Pengguna — Smart Waste Management" },
      { property: "og:description", content: "Undang pengguna dan atur peran akun Smart Waste Management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPengguna,
});

const ROLES: AppRole[] = ["masyarakat", "petugas", "admin"];

function AdminPengguna() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    enabled: me?.role === "admin",
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("*").order("full_name");
      if (error) throw error;
      const { data: roles, error: rolesError } = await supabase.from("user_roles").select("user_id, role");
      if (rolesError) throw rolesError;
      const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role as AppRole]));
      return (profiles ?? []).map((p) => ({ ...p, role: roleMap.get(p.id) ?? ("masyarakat" as AppRole) }));
    },
  });

  const removeFn = useServerFn(deleteUser);
  const remove = useMutation({
    mutationFn: (userId: string) => removeFn({ data: { userId } }),
    onSuccess: (r) => {
      toast.success(`Akun ${r.full_name || r.email} dihapus`);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e) => toast.error(e.message),
  });
  const [toDelete, setToDelete] = useState<{ id: string; full_name: string; email: string } | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = (data ?? []).find((u) => u.id === selectedId) ?? null;

  if (me?.role !== "admin") return <p className="text-muted-foreground">Halaman ini hanya untuk admin.</p>;

  return (
    <div>
      <PageHeader icon={Users} title="Kelola Pengguna" text="Tekan akun untuk melihat dan mengubah detailnya." />
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari pengguna" aria-label="Cari pengguna" className="h-11 bg-card pl-9" />
        </div>
        <InviteUserDialog />
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Memuat pengguna…</p>}
      <div className="space-y-2.5">
        {(data ?? []).filter((u) => matchesQuery(q, u.full_name, u.email, ROLE_LABEL[u.role], u.whatsapp)).map((u) => (
          <button key={u.id} type="button" onClick={() => setSelectedId(u.id)} className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3.5 text-left shadow-card transition hover:bg-muted/50">
            <UserAvatar url={u.avatar_url} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{u.full_name || "Tanpa nama"}</p>
              <p className="text-sm text-muted-foreground">{ROLE_LABEL[u.role]}</p>
              <p className="truncate text-sm text-muted-foreground">{u.email}</p>
            </div>
            <StatusBadge tone={u.is_active ? "success" : "danger"}>{u.is_active ? "Aktif" : "Nonaktif"}</StatusBadge>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
      <Dialog open={!!selected} onOpenChange={(v) => { if (!v) setSelectedId(null); }}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto">
          {selected && (
            <UserDetail
              key={selected.id}
              user={selected}
              isSelf={selected.id === me.id}
              onDelete={() => setToDelete({ id: selected.id, full_name: selected.full_name, email: selected.email ?? "" })}
              onSaved={() => { qc.invalidateQueries({ queryKey: ["admin", "users"] }); }}
            />
          )}
        </DialogContent>
      </Dialog>
      <DeleteUserDialog
        user={toDelete}
        pending={remove.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={(id) => remove.mutate(id, { onSuccess: () => { setToDelete(null); setSelectedId(null); } })}
      />
    </div>
  );
}

function UserAvatar({ url, size = "size-12" }: { url?: string | null; size?: string }) {
  return url
    ? <img src={url} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
    : <div className={`${size} flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground`}><User className="size-1/2" /></div>;
}

type AdminUser = { id: string; full_name: string; email: string | null; whatsapp: string | null; avatar_url: string | null; is_active: boolean; role: AppRole };

function UserDetail({ user, isSelf, onDelete, onSaved }: { user: AdminUser; isSelf: boolean; onDelete: () => void; onSaved: () => void }) {
  const [name, setName] = useState(user.full_name);
  const [whatsapp, setWhatsapp] = useState(user.whatsapp ?? "");
  const [role, setRole] = useState<AppRole>(user.role);
  const [active, setActive] = useState(user.is_active);
  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Nama lengkap wajib diisi.");
      if (name.trim() !== user.full_name || whatsapp.trim() !== (user.whatsapp ?? "") || active !== user.is_active) {
        const { error } = await supabase.from("profiles").update({ full_name: name.trim(), whatsapp: whatsapp.trim() || null, is_active: active }).eq("id", user.id);
        if (error) throw error;
      }
      if (role !== user.role) {
        const { error } = await supabase.rpc("set_user_role", { target_user_id: user.id, assigned_role: role });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Data pengguna diperbarui"); onSaved(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="space-y-5">
      <DialogHeader><DialogTitle>Detail Pengguna</DialogTitle><DialogDescription className="sr-only">Ubah data akun pengguna.</DialogDescription></DialogHeader>
      <div className="flex items-center gap-4">
        <UserAvatar url={user.avatar_url} size="size-16" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{user.full_name || "Tanpa nama"}</p>
          <p className="text-sm text-muted-foreground">{ROLE_LABEL[user.role]}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border p-4">
        <DetailField label="Nama Lengkap" icon={User}><Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-muted/50 pl-9" /></DetailField>
        <DetailField label="Email" icon={Mail}><Input value={user.email ?? ""} readOnly disabled className="h-11 bg-muted/50 pl-9" /></DetailField>
        <DetailField label="WhatsApp" icon={Phone}><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} type="tel" className="h-11 bg-muted/50 pl-9" /></DetailField>
        <DetailField label="Peran" icon={Shield}>
          <select value={role} onChange={(e) => setRole(e.target.value as AppRole)} disabled={isSelf} className="h-11 w-full rounded-md border bg-muted/50 pl-9 pr-3 text-sm">
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </DetailField>
        <div>
          <Label className="mb-1.5 block text-sm font-semibold">Status Akun</Label>
          <div className="grid grid-cols-2 rounded-md bg-muted p-1">
            {[true, false].map((v) => (
              <button key={String(v)} type="button" disabled={isSelf} onClick={() => setActive(v)} className={`h-9 rounded text-sm font-semibold transition ${active === v ? "bg-primary text-primary-foreground shadow-card" : "text-muted-foreground"}`}>{v ? "Aktif" : "Nonaktif"}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t pt-4">
          <Button variant="outline" className="h-11" onClick={() => save.mutate()} disabled={save.isPending}><Pencil className="size-4" /> {save.isPending ? "Menyimpan…" : "Ubah"}</Button>
          <Button variant="outline" className="h-11 text-danger hover:bg-danger-soft" onClick={onDelete} disabled={isSelf} title={isSelf ? "Anda tidak dapat menghapus akun sendiri" : undefined}><Trash2 className="size-4" /> Hapus</Button>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, icon: Icon, children }: { label: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-semibold">{label}</Label>
      <div className="relative"><Icon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />{children}</div>
    </div>
  );
}

/** Deletion cannot be undone, so the dialog asks for one direct confirmation. */
function DeleteUserDialog({ user, pending, onClose, onConfirm }: { user: { id: string; full_name: string; email: string } | null; pending: boolean; onClose: () => void; onConfirm: (id: string) => void }) {
  return (
    <AlertDialog open={!!user} onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus akun {user?.full_name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Akun <span className="font-semibold text-foreground break-all">{user?.email}</span> akan dihapus permanen beserta profil dan perannya. Tindakan ini tidak bisa dibatalkan dan pengguna tidak lagi bisa login.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <Button variant="destructive" disabled={pending} onClick={() => user && onConfirm(user.id)}>{pending ? "Menghapus…" : "Hapus"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<AppRole>("masyarakat");
  const [result, setResult] = useState<{ email: string; full_name: string } | null>(null);
  const invite = useServerFn(inviteUser);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: invite,
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => toast.error(error.message),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null); }}>
      {/* Reopening must always start a fresh invite, never show the previous success screen. */}
      <DialogTrigger asChild><Button className="h-11" onClick={() => { setRole("masyarakat"); setResult(null); }}><UserPlus className="size-4" /> Tambah</Button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto">
        {result ? (
          <div className="space-y-4">
            <DialogHeader><DialogTitle>Akun berhasil dibuat</DialogTitle><DialogDescription>{result.full_name} dapat login dengan email {result.email} dan password yang Anda tetapkan. Email undangan telah dikirim ke pengguna.</DialogDescription></DialogHeader>
            <Button className="w-full" onClick={() => setOpen(false)}>Selesai</Button>
          </div>
        ) : (<>
        <DialogHeader><DialogTitle>Tambah pengguna</DialogTitle><DialogDescription>Tetapkan password awal untuk pengguna baru.</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          const f = new FormData(event.currentTarget);
          const value = (key: string) => String(f.get(key) ?? "").trim();
          const password = String(f.get("password") ?? "");
          if (password.length < 8) { toast.error("Password minimal 8 karakter."); return; }
          if (password !== String(f.get("confirm"))) { toast.error("Konfirmasi password tidak sama."); return; }
          mutation.mutate({ data: { email: value("email"), full_name: value("full_name"), whatsapp: value("whatsapp"), role, address: value("address"), rt_rw: value("rt_rw"), kelurahan: value("kelurahan"), password } });
        }}>
          <div><Label htmlFor="invite-role">Peran</Label><select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as AppRole)} className="mt-1.5 h-11 w-full rounded-md border bg-background px-3 text-sm">{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></div>
          <InviteField name="full_name" label="Nama lengkap" required />
          <InviteField name="email" label="Email" type="email" required />
          <div><Label htmlFor="invite-password">Password awal</Label><PasswordInput id="invite-password" name="password" required minLength={8} maxLength={128} autoComplete="new-password" className="mt-1.5 h-11" /></div>
          <div><Label htmlFor="invite-confirm">Konfirmasi password</Label><PasswordInput id="invite-confirm" name="confirm" required minLength={8} autoComplete="new-password" className="mt-1.5 h-11" /></div>
          <InviteField name="whatsapp" label="WhatsApp" type="tel" />
          {role === "masyarakat" && <><InviteField name="address" label="Alamat" /><div className="grid grid-cols-2 gap-3"><InviteField name="rt_rw" label="Lingkungan/Jaga" /><InviteField name="kelurahan" label="Kelurahan" /></div></>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>Batal</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Membuat…" : "Buat akun"}</Button></div>
        </form></>)}
      </DialogContent>
    </Dialog>
  );
}

function InviteField({ name, label, type = "text", required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return <div><Label htmlFor={`invite-${name}`}>{label}</Label><Input id={`invite-${name}`} name={name} type={type} required={required} className="mt-1.5 h-11" /></div>;
}
