import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, KeyRound, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { saveRecoveredPassword, sendRecoveryCode } from "@/lib/password-recovery";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/lupa-password")({
  head: () => ({ meta: [
    { title: "Lupa Password — Smart Waste Management" },
    { name: "description", content: "Pulihkan password akun Smart Waste Management melalui tautan di email." },
    { property: "og:title", content: "Lupa Password — Smart Waste Management" },
    { property: "og:description", content: "Atur password baru Anda melalui tautan yang dikirim ke email." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "sent" | "password">("email");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const Icon = step === "email" ? Mail : step === "sent" ? MailCheck : KeyRound;
  async function send() {
    await sendRecoveryCode(email);
    setStep("sent");
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setBusy(true);
    try {
      if (step === "email") {
        await send();
        toast.success(`Tautan pengaturan password dikirim ke ${email}.`);
      } else {
        const password = String(f.get("password") ?? "");
        if (password !== String(f.get("confirm"))) throw new Error("Konfirmasi password tidak sama.");
        await saveRecoveredPassword(password);
        await qc.cancelQueries();
        qc.clear();
        await supabase.auth.signOut();
        toast.success("Password berhasil disimpan. Silakan login dengan password baru.");
        await navigate({ to: "/auth", replace: true });
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Permintaan gagal. Coba kembali."); }
    finally { setBusy(false); }
  }
  return <div className="theme-community min-h-screen bg-background px-5 py-10 md:py-16">
    <div className="mx-auto w-full max-w-md">
      <Brand />
      <Link to="/auth" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" />Kembali ke login</Link>
      <Icon className="mt-8 size-8 text-brand-mid" />
      <h1 className="mt-4 font-display text-3xl font-semibold">{step === "email" ? "Lupa password" : step === "sent" ? "Periksa email Anda" : "Password baru"}</h1>
      {step === "sent" && <>
        <p className="mt-3 break-words text-sm text-muted-foreground">Kami mengirim tautan untuk mengatur password baru ke {email}. Buka email tersebut dan tekan tautannya — Anda akan langsung diarahkan ke halaman password baru.</p>
        <p className="mt-2 text-sm text-muted-foreground">Jika email tidak terlihat, periksa folder spam. Tautan berlaku 1 jam.</p>
      </>}
      <form key={step} onSubmit={submit} className="mt-6 space-y-4">
        {step === "email" && <div><Label htmlFor="recovery-email">Email akun</Label><Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11" /></div>}
        {step === "password" && <>
          <div><Label htmlFor="recovery-password">Password baru</Label><PasswordInput id="recovery-password" name="password" required minLength={8} maxLength={128} autoComplete="new-password" className="mt-2 h-11" /></div>
          <div><Label htmlFor="recovery-confirm">Konfirmasi password baru</Label><PasswordInput id="recovery-confirm" name="confirm" required minLength={8} autoComplete="new-password" className="mt-2 h-11" /></div>
        </>}
        {step !== "sent" && <Button type="submit" className="h-11 w-full" disabled={busy}>{busy ? "Memproses…" : step === "email" ? "Kirim tautan reset" : "Simpan password"}</Button>}
      </form>
      {step === "sent" && <div className="mt-4 flex justify-between gap-3">
        <Button variant="link" disabled={busy} onClick={() => setStep("email")}>Ganti email</Button>
        <Button variant="link" disabled={busy} onClick={async () => { setBusy(true); try { await send(); toast.success("Tautan baru dikirim ke email Anda."); } catch (error) { toast.error(error instanceof Error ? error.message : "Gagal mengirim email."); } finally { setBusy(false); } }}>Kirim ulang tautan</Button>
      </div>}
    </div>
  </div>;
}
