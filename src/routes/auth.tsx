import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RoleSelection } from "@/components/role-selection";
import community from "@/assets/community-clean.jpg";
import { ROLE_THEME } from "@/lib/session";
import { canRegister } from "@/lib/permissions";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/password-input";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const ROLE_TITLE: Record<RoleKey, string> = { admin: "Admin", petugas: "Petugas Kebersihan", masyarakat: "Masyarakat" };

type RoleKey = "admin" | "petugas" | "masyarakat";
type Search = { mode?: "login" | "register" | undefined; redirect?: string | undefined; role?: RoleKey | undefined; registered?: boolean | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s["mode"] === "register" ? "register" : "login",
    redirect: typeof s["redirect"] === "string" ? (s["redirect"] as string) : undefined,
    role: s["role"] === "admin" || s["role"] === "petugas" || s["role"] === "masyarakat" ? (s["role"] as RoleKey) : undefined,
    registered: s["registered"] === "1" || s["registered"] === true || s["registered"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Masuk atau Daftar — Smart Waste Management" },
      { name: "description", content: "Masuk atau buat akun warga untuk Smart Waste Management System." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Masuk — Smart Waste Management" },
      { property: "og:description", content: "Masuk atau buat akun warga." },
    ],
  }),
  component: AuthPage,
});

function safePath(p?: string) {
  if (!p) return "/beranda";
  try {
    const u = new URL(p, window.location.origin);
    return u.origin === window.location.origin ? u.pathname + u.search : "/beranda";
  } catch {
    return "/beranda";
  }
}

function AuthPage() {
  const { mode: m = "login", redirect, role, registered } = Route.useSearch();
  const mode = canRegister(role) ? m : "login";
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | undefined>();
  const [rememberDefault, setRememberDefault] = useState(true);
  const [justRegistered, setJustRegistered] = useState(false);
  useEffect(() => {
    setSavedEmail(localStorage.getItem("sw-email") ?? undefined);
    setRememberDefault(localStorage.getItem("sw-remember") !== "0");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: safePath(redirect), replace: true });
    });
  }, [navigate, redirect]);

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const email = String(f.get("email")).trim();
    const remember = f.get("remember") === "on";
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: String(f.get("password")),
    });
    if (error) { setBusy(false); toast.error("Email atau password salah. Silakan coba kembali."); return; }
    const { data: actual } = await supabase.rpc("get_my_role");
    setBusy(false);
    if (role && actual !== role) {
      await supabase.auth.signOut();
      toast.error(`Akun ini bukan akun ${ROLE_TITLE[role]}. Silakan pilih peran yang sesuai.`);
      return;
    }
    rememberSession(remember, email);
    navigate({ to: safePath(redirect), replace: true });
  }

  async function onRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    if (v("password").length < 8) { toast.error("Password minimal 8 karakter."); return; }
    if (v("password") !== v("confirm")) { toast.error("Konfirmasi password tidak sama."); return; }
    if (!/^(\+62|62|0)8\d{7,12}$/.test(v("whatsapp").replace(/[\s-]/g, "")))
      { toast.error("Nomor WhatsApp tidak valid (contoh: 0812xxxxxxx)."); return; }
    setBusy(true);
    const { data: signed, error } = await supabase.auth.signUp({
      email: v("email"),
      password: v("password"),
      options: {
        emailRedirectTo: "https://smart-wasteweb.lovable.app/beranda",
        data: {
          full_name: v("full_name"),
          whatsapp: v("whatsapp"),
          address: v("address"),
          rt_rw: v("rt_rw"),
          kelurahan: v("kelurahan"),
        },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message.includes("registered") ? "Email sudah digunakan." : error.message); return; }
    if (signed.session) {
      await supabase.auth.signOut();
      rememberSession(true, v("email"));
      setSavedEmail(v("email"));
      setJustRegistered(true);
      toast.success("Pendaftaran berhasil. Silakan masuk dengan akun Anda.");
      navigate({ to: "/auth", search: { mode: "login", role: "masyarakat", registered: true, redirect }, replace: true });
      return;
    }
    setSavedEmail(v("email"));
    setSent(true);
  }


  if (!role) return <RoleSelection redirect={redirect} />;

  return (
    <div className={`${ROLE_THEME[role]} grid min-h-screen bg-background lg:grid-cols-2`}>
      <div className="relative hidden overflow-hidden flex-col justify-between p-10 text-on-brand lg:flex">
        <img src={community} alt="Warga dan petugas kebersihan" width={1536} height={1024} className="absolute inset-0 h-full w-full object-cover" />
        <div className="photo-shade absolute inset-0" />
        <div className="relative"><Brand onDark /></div>
        <div className="relative">
          <h2 className="font-display text-5xl font-semibold leading-tight">Lingkungan bersih,<br />dimulai dari kita.</h2>
          <p className="mt-4 max-w-sm text-on-brand-muted">Sistem informasi pengelolaan sampah RW 10 Airmadidi Atas.</p>
        </div>
        <p className="relative text-xs text-on-brand-muted">RW 10 · Airmadidi Atas</p>
      </div>
      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Brand /></div>
          {sent ? (
            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <h1 className="font-display text-2xl font-semibold">Cek email Anda</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Pendaftaran berhasil. Klik tautan konfirmasi yang kami kirim ke email Anda, lalu masuk.
              </p>
              <Button asChild className="mt-5 w-full"><Link to="/auth" search={{ mode: "login", role: "masyarakat" }} onClick={() => setSent(false)}>Ke halaman Login</Link></Button>
            </div>
          ) : (
            <>
              <Link to="/auth" search={{ redirect }} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" /> Kembali ke pilih peran
              </Link>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-mid">Login {ROLE_TITLE[role]}</p>
              <h1 className="font-display text-3xl font-semibold">{mode === "login" ? "Selamat datang kembali" : "Buat akun warga"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "login" ? "Masuk untuk melihat informasi pengelolaan sampah." : "Isi data diri Anda sesuai domisili."}
              </p>
              {mode === "login" && (registered || justRegistered) ? (
                <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  <span>Pendaftaran berhasil. Silakan masuk dengan email dan password Anda.</span>
                </div>
              ) : null}
              {mode === "login" ? (
                <form onSubmit={onLogin} className="mt-6 space-y-4">
                  <Field key={savedEmail ?? "e"} name="email" label="Email" type="email" defaultValue={savedEmail} />
                  <Field name="password" label="Password" type="password" />
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox key={String(rememberDefault)} name="remember" defaultChecked={rememberDefault} /> Ingat saya
                    </label>
                    <Button asChild variant="link" className="h-auto p-0 text-sm font-semibold text-brand-mid"><Link to="/lupa-password">Lupa password?</Link></Button>
                  </div>
                  <Button type="submit" className="h-11 w-full" disabled={busy}>{busy ? "Memproses…" : "Login"}</Button>
                </form>
              ) : null}
              {mode === "login" ? null : (
                <form onSubmit={onRegister} className="mt-6 grid grid-cols-2 gap-3">
                  <Field name="full_name" label="Nama lengkap" className="col-span-2" />
                  <Field name="whatsapp" label="Nomor WhatsApp" type="tel" />
                  <Field name="email" label="Email" type="email" />
                  <Field name="address" label="Alamat" className="col-span-2" />
                  <Field name="rt_rw" label="Lingkungan/Jaga" placeholder="Lingkungan 3 / Jaga 10" />
                  <Field name="kelurahan" label="Kelurahan" />
                  <Field name="password" label="Password" type="password" />
                  <Field name="confirm" label="Konfirmasi password" type="password" />
                  <label className="col-span-2 flex items-start gap-2 text-sm text-muted-foreground">
                    <Checkbox required name="agree" className="mt-0.5" /> Saya menyatakan data yang diisi benar.
                  </label>
                  <Button type="submit" className="col-span-2 h-11" disabled={busy}>{busy ? "Memproses…" : "Daftar"}</Button>
                </form>
              )}
              {role === "masyarakat" && (<>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
                <Link to="/auth" search={{ mode: mode === "login" ? "register" : "login", redirect, role }} className="font-semibold text-brand-mid">
                  {mode === "login" ? "Register" : "Login"}
                </Link>
              </p></>)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function rememberSession(remember: boolean, email: string) {
  localStorage.setItem("sw-remember", remember ? "1" : "0");
  sessionStorage.setItem("sw-active", "1");
  if (remember) localStorage.setItem("sw-email", email); else localStorage.removeItem("sw-email");
}

function Field({ name, label, type = "text", className, placeholder, defaultValue }: { name: string; label: string; type?: string; className?: string; placeholder?: string; defaultValue?: string | undefined }) {
  return (
    <div className={className}>
      <Label htmlFor={name} className="mb-1.5 block text-xs font-semibold">{label}</Label>
      {type === "password" ? (
        <PasswordInput id={name} name={name} required placeholder={placeholder} className="h-11 bg-card" />
      ) : (
        <Input id={name} name={name} type={type} required placeholder={placeholder} defaultValue={defaultValue} className="h-11 bg-card" />
      )}
    </div>
  );
}

