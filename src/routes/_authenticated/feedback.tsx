import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ImagePlus, Loader2, MessageSquareHeart, Send, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { EmptyState, SectionHead } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JENIS, KATEGORI, feedbackSchema, fmtDateTime, resizePhoto } from "@/lib/feedback";
import { FeedbackBody, FeedbackMeta, RepliesList, type FeedbackRow } from "@/components/feedback-thread";
import { DeleteFeedbackButton } from "@/components/feedback-delete";

export const Route = createFileRoute("/_authenticated/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback — Smart Waste Management" },
      { name: "description", content: "Kirim keluhan, saran, atau apresiasi tentang pelayanan sampah." },
      { property: "og:title", content: "Feedback — Smart Waste Management" },
      { property: "og:description", content: "Kirim keluhan, saran, atau apresiasi tentang pelayanan sampah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeedbackPage,
});

const empty = { jenis_feedback: "", kategori: "", judul: "", isi_pesan: "" };

function FeedbackPage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [photo, setPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<FeedbackRow | null>(null);

  const { data: list } = useQuery({
    queryKey: ["feedback", "mine", me?.id],
    enabled: !!me,
    queryFn: async () => (await supabase.from("feedback").select("*").eq("user_id", me!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const send = useMutation({
    mutationFn: async () => {
      const parsed = feedbackSchema.safeParse(form);
      if (!parsed.success) {
        const e: Record<string, string> = {};
        parsed.error.issues.forEach((i) => (e[String(i.path[0])] = i.message));
        setErrors(e);
        throw new Error("Lengkapi data yang wajib diisi.");
      }
      setErrors({});
      const { error } = await supabase.from("feedback").insert({ ...parsed.data, user_id: me!.id, foto_url: photo });
      if (error) throw new Error("Feedback gagal dikirim. Coba lagi.");
    },
    onSuccess: () => {
      toast.success("Feedback berhasil terkirim. Terima kasih!");
      setForm(empty);
      setPhoto(null);
      qc.invalidateQueries({ queryKey: ["feedback"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (me && me.role !== "masyarakat") return <EmptyState icon={MessageSquareHeart} title="Halaman ini untuk warga" text="Buka menu Kelola Feedback untuk melihat feedback masyarakat." />;

  const set = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-8">
      <section>
        <SectionHead title="Kirim Feedback" eyebrow="Suara warga" />
        <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="space-y-4 rounded-2xl border bg-card p-4 shadow-card sm:p-5">
          <p className="text-xs text-muted-foreground">Dikirim sebagai <b>{me?.profile?.full_name || me?.email}</b> ({me?.email})</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jenis Feedback" error={errors["jenis_feedback"]}>
              <Select value={form.jenis_feedback} onValueChange={(v) => set("jenis_feedback", v)}>
                <SelectTrigger><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                <SelectContent>{Object.entries(JENIS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Kategori" error={errors["kategori"]}>
              <Select value={form.kategori} onValueChange={(v) => set("kategori", v)}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>{Object.entries(KATEGORI).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Judul Feedback" error={errors["judul"]}>
            <Input value={form.judul} maxLength={150} onChange={(e) => set("judul", e.target.value)} placeholder="Contoh: Sampah belum diangkut" />
          </Field>
          <Field label="Isi Feedback" error={errors["isi_pesan"]}>
            <Textarea value={form.isi_pesan} maxLength={3000} rows={5} onChange={(e) => set("isi_pesan", e.target.value)} placeholder="Ceritakan keluhan, saran, atau apresiasi Anda" />
          </Field>
          <div className="space-y-1.5">
            <Label>Foto Pendukung (opsional)</Label>
            {photo ? (
              <div className="relative w-fit">
                <img src={photo} alt="Pratinjau foto" className="max-h-40 rounded-xl" />
                <button type="button" onClick={() => setPhoto(null)} className="absolute right-1 top-1 rounded-full bg-card p-1 shadow" aria-label="Hapus foto"><X className="size-4" /></button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted/50">
                <ImagePlus className="size-4" /> Pilih foto
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try { setPhoto(await resizePhoto(f)); } catch { toast.error("Foto tidak bisa dibaca."); }
                }} />
              </label>
            )}
          </div>
          <Button type="submit" disabled={send.isPending} className="w-full sm:w-auto">
            {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Kirim Feedback
          </Button>
        </form>
      </section>

      <section>
        <SectionHead title="Riwayat Feedback" eyebrow="Milik Anda" />
        <div className="space-y-2.5">
          {(list ?? []).length === 0 && <EmptyState icon={MessageSquareHeart} title="Belum ada feedback" text="Feedback yang Anda kirim akan muncul di sini." />}
          {(list ?? []).map((f) => (
            <button key={f.id} onClick={() => setOpen(f)} className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-card transition hover:bg-muted/40">
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="truncate font-semibold">{f.judul}</p>
                <FeedbackMeta f={f} />
                <p className="text-xs text-muted-foreground">{fmtDateTime(f.created_at)}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader><DialogTitle>{open.judul}</DialogTitle></DialogHeader>
              <FeedbackBody f={open} />
              <RepliesList id={open.id} />
              <DeleteFeedbackButton id={open.id} onDeleted={() => setOpen(null)} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label} <span className="text-danger">*</span></Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
