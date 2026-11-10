import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({ flow: search["flow"] === "invite" ? "invite" : "recovery" }),
  head: () => ({
    meta: [
      { title: "Atur Password Baru — Smart Waste Management" },
      { name: "description", content: "Buat password baru untuk akun Smart Waste Management Anda." },
      { property: "og:title", content: "Atur Password Baru — Smart Waste Management" },
      { property: "og:description", content: "Buat password baru untuk akun Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const { flow } = Route.useSearch();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);
      if (params.has("error") || query.has("error")) { setInvalid(true); return; }
      const code = query.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { if (!cancelled) setInvalid(true); return; }
      }
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error || !data.session) setInvalid(true);
      else setReady(true);
    }
    void verify();
    return () => { cancelled = true; };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pw = String(f.get("password"));
    if (pw.length < 8) { toast.error("Password minimal 8 karakter."); return; }
    if (pw !== String(f.get("confirm"))) { toast.error("Konfirmasi password tidak sama."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password berhasil disimpan.");
    navigate({ to: "/beranda", replace: true });
  }

  return (
    <div className="theme-community flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-md">
        <div className="mb-8"><Brand /></div>
        <h1 className="font-display text-3xl font-semibold">{flow === "invite" ? "Buat password akun" : "Atur password baru"}</h1>
        {invalid ? <div className="mt-4 space-y-4"><p className="text-sm text-muted-foreground">Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru melalui Lupa password.</p><Button asChild variant="outline"><Link to="/auth">Kembali ke pilih peran</Link></Button></div> : !ready ? (
          <p className="mt-2 text-sm text-muted-foreground">Memverifikasi tautan… Jika tidak berubah, buka kembali tautan dari email Anda.</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div><Label htmlFor="password" className="mb-1.5 block text-xs font-semibold">Password baru</Label><PasswordInput id="password" name="password" required className="h-11 bg-card" /></div>
            <div><Label htmlFor="confirm" className="mb-1.5 block text-xs font-semibold">Konfirmasi password</Label><PasswordInput id="confirm" name="confirm" required className="h-11 bg-card" /></div>
            <Button type="submit" className="h-11 w-full" disabled={busy}>{busy ? "Menyimpan…" : "Simpan password"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
