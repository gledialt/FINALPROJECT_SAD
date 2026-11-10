import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ChevronRight, Home, KeyRound, Loader2, Mail, MapPin, Pencil, Phone, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { Avatar, SignOutButton } from "@/routes/_authenticated/route";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { ROLE_LABEL, useMe, type Profile } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/akun")({
  head: () => ({
    meta: [
      { title: "Akun — Smart Waste Management" },
      { name: "description", content: "Profil dan pengaturan akun Anda." },
      { property: "og:title", content: "Akun — Smart Waste Management" },
      { property: "og:description", content: "Profil dan pengaturan akun Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Akun,
});

function Akun() {
  const { data: me } = useMe();
  const p = me?.profile;
  const isResident = me?.role === "masyarakat";

  return (
    <div className="mx-auto max-w-2xl">
      <section className="profile-hero flex flex-wrap items-center gap-5 rounded-2xl border p-5 shadow-card md:p-6">
        <AvatarPicker profile={p ?? null} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-semibold md:text-2xl">{p?.full_name || "Nama Pengguna"}</p>
          <p className="text-sm text-brand-mid">{me ? ROLE_LABEL[me.role] : ""}</p>
          <p className="truncate text-sm text-muted-foreground">{me?.email}</p>
        </div>
        {p && <EditProfile profile={p} isResident={isResident} />}
      </section>
      <section className="mt-4 divide-y rounded-2xl border bg-card px-2 shadow-card">
        <Row icon={User} label="Nama Lengkap" value={p?.full_name} />
        <Row icon={Mail} label="Email" value={me?.email} />
        <Row icon={ShieldCheck} label="Peran" value={me ? ROLE_LABEL[me.role] : ""} />
        <Row icon={Phone} label="Nomor Telepon" value={p?.whatsapp} />
        {isResident && (
          <>
            <Row icon={MapPin} label="Alamat" value={p?.address} />
            <Row icon={Home} label="Lingkungan/Jaga" value={p?.rt_rw} />
            <Row icon={MapPin} label="Kelurahan" value={p?.kelurahan} />
          </>
        )}
      </section>
      {me && <ChangePassword email={me.email} />}
      <div className="mt-4">
        <SignOutButton className="w-full justify-center border bg-card text-danger hover:bg-danger-soft" />
      </div>
    </div>
  );
}

async function resizeImage(file: File, size = 320): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const side = Math.min(img.width, img.height);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    canvas.getContext("2d")?.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function AvatarPicker({ profile }: { profile: Profile | null }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) { toast.error("Pilih file gambar."); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Ukuran foto maksimal 8 MB."); return; }
    setBusy(true);
    try {
      const dataUrl = await resizeImage(file);
      const { error } = await supabase.from("profiles").update({ avatar_url: dataUrl }).eq("id", profile.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Foto profil diperbarui.");
    } catch {
      toast.error("Foto profil gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <label className="relative shrink-0 cursor-pointer" aria-label="Ganti foto profil">
      <Avatar name={profile?.full_name} src={profile?.avatar_url} className="size-24 text-2xl" />
      <span className="absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full border-2 border-card bg-brand text-on-brand shadow-card">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
      </span>
      <input type="file" accept="image/*" className="sr-only" onChange={onFile} disabled={busy} />
    </label>
  );
}

function ChangePassword({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const current = String(f.get("current"));
    const pw = String(f.get("new"));
    if (pw.length < 8) { toast.error("Password baru minimal 8 karakter."); return; }
    if (pw !== String(f.get("confirm"))) { toast.error("Konfirmasi password tidak sama."); return; }
    setBusy(true);
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password: current });
    if (authErr) { setBusy(false); toast.error("Password lama salah."); return; }
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: current });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    form.reset();
    toast.success("Password berhasil diubah.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="mt-5 h-auto w-full justify-between py-4"><span className="flex items-center gap-3"><KeyRound className="size-5 text-brand-mid" />Ubah password</span><ChevronRight className="size-4" /></Button></DialogTrigger>
      <DialogContent><DialogHeader><DialogTitle>Ubah password</DialogTitle><DialogDescription>Perbarui keamanan akun Anda.</DialogDescription></DialogHeader>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <PwField name="current" label="Password lama" />
        <PwField name="new" label="Password baru" />
        <PwField name="confirm" label="Konfirmasi password baru" />
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Menyimpan…" : "Simpan password"}</Button>
      </form>
      <div className="mt-4 rounded-xl bg-muted p-3 text-sm">
        <Button asChild variant="link" className="p-0"><Link to="/lupa-password" onClick={() => setOpen(false)}>Lupa password lama?</Link></Button>
      </div>
      </DialogContent>
    </Dialog>
  );
}

function PwField({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <Label htmlFor={name} className="mb-1.5 block text-xs font-semibold">{label}</Label>
      <PasswordInput id={name} name={name} required className="h-11" />
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value?: string | null | undefined }) {
  return (
    <div className="flex items-center gap-4 px-3 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-pale text-brand"><Icon className="size-5" /></span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="break-words text-sm text-muted-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}

function EditProfile({ profile, isResident }: { profile: Profile; isResident: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "").trim();
    const whatsapp = value("whatsapp");
    if (whatsapp && !/^(\+62|62|0)8\d{7,12}$/.test(whatsapp.replace(/[\s-]/g, ""))) { toast.error("Nomor WhatsApp tidak valid."); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: value("full_name"), whatsapp: whatsapp || null,
      ...(isResident ? { address: value("address"), rt_rw: value("rt_rw"), kelurahan: value("kelurahan") } : {}),
    }).eq("id", profile.id).select("id").single();
    setBusy(false);
    if (error) { toast.error("Profil belum tersimpan. Silakan coba kembali."); return; }
    await qc.invalidateQueries({ queryKey: ["me"] });
    toast.success("Profil berhasil diperbarui."); setOpen(false);
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline"><Pencil className="size-4" />Ubah profil</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Ubah profil</DialogTitle><DialogDescription>Data akun Anda.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-4">
    {[{ name: "full_name", label: "Nama lengkap", value: profile.full_name, required: true }, { name: "whatsapp", label: "Nomor Telepon / WhatsApp", value: profile.whatsapp, required: false }, ...(isResident ? [{ name: "address", label: "Alamat", value: profile.address, required: false }, { name: "rt_rw", label: "Lingkungan/Jaga", value: profile.rt_rw, required: false }, { name: "kelurahan", label: "Kelurahan", value: profile.kelurahan, required: false }] : [])].map((field) => <div key={field.name}><Label htmlFor={`profile-${field.name}`} className="mb-2 block">{field.label}</Label><Input id={`profile-${field.name}`} name={field.name} defaultValue={field.value ?? ""} required={field.required} /></div>)}
    <Button type="submit" disabled={busy} className="w-full">{busy ? "Menyimpan…" : "Simpan profil"}</Button>
  </form></DialogContent></Dialog>;
}
