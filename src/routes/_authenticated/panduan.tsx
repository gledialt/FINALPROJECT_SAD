import { createFileRoute } from "@tanstack/react-router";
import { BookOpenCheck, CheckCircle2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/common";
import { CATEGORIES } from "@/components/waste-categories";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { guidesQuery } from "@/lib/guides";
import { useMe } from "@/lib/session";
import { canManageOperations } from "@/lib/permissions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/panduan")({
  head: () => ({
    meta: [
      { title: "Panduan Pemilahan — Smart Waste Management" },
      { name: "description", content: "Panduan memilah sampah organik, anorganik, residu, dan B3." },
      { property: "og:title", content: "Panduan Pemilahan — Smart Waste Management" },
      { property: "og:description", content: "Panduan memilah sampah organik, anorganik, residu, dan B3." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(guidesQuery),
  component: Panduan,
});

type Guide = Database["public"]["Tables"]["sorting_guides"]["Row"];

function Panduan() {
  const { data: guides } = useSuspenseQuery(guidesQuery);
  const { data: me } = useMe();
  const allowed = canManageOperations(me?.role, "guides");
  const [editing, setEditing] = useState<Guide | null>(null);
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: async (guide: Guide) => {
      const { error } = await supabase.from("sorting_guides").update({ name: guide.name.trim(), short: guide.short.trim(), detail: guide.detail.trim(), updated_at: new Date().toISOString() }).eq("key", guide.key).select("key").single();
      if (error) throw error;
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: guidesQuery.queryKey }); setEditing(null); toast.success("Panduan berhasil diperbarui."); },
    onError: (error) => toast.error(error.message),
  });
  const tips = guides.find((g) => g.key === "tips");
  return <div>
    <PageHeader icon={BookOpenCheck} title={allowed ? "Edit Panduan Pemilahan" : "Panduan Pemilahan"} text={allowed ? "Perubahan akan tampil di Beranda semua pengguna." : "Cara memilah sampah sebelum dibuang."} />
    <div className="grid gap-4 md:grid-cols-2">
      {guides.filter((g) => g.key !== "tips").map((guide) => {
        const visual = CATEGORIES.find((c) => c.key === guide.key);
        if (!visual) return null;
        return <article key={guide.key} className="guide-item rounded-lg border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3"><span className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-on-brand ${visual.color}`}><visual.icon className="size-5" /></span><div className="min-w-0 flex-1"><h2 className="font-display text-lg font-semibold">{guide.name}</h2><p className="text-xs text-muted-foreground">{guide.short}</p></div>{allowed && <Button size="icon" variant="outline" aria-label={`Ubah panduan ${guide.name}`} onClick={() => setEditing(guide)}><Pencil className="size-4" /></Button>}</div>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{guide.detail}</p>
        </article>;
      })}
    </div>
    {tips && <section className="mt-8 border-y py-6"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold text-brand">{tips.name}</h2>{allowed && <Button size="icon" variant="outline" aria-label="Ubah tips pemilahan" onClick={() => setEditing(tips)}><Pencil className="size-4" /></Button>}</div><ul className="mt-4 grid gap-3 md:grid-cols-2">{tips.detail.split("\n").filter(Boolean).map((tip, index) => <li key={index} className="flex items-start gap-2.5 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-mid" />{tip}</li>)}</ul></section>}
    <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}><DialogContent><DialogHeader><DialogTitle>Ubah panduan pemilahan</DialogTitle><DialogDescription>{editing?.name}</DialogDescription></DialogHeader>{editing && <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }}><div><Label htmlFor="guide-name">Judul</Label><Input id="guide-name" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>{editing.key !== "tips" && <div><Label htmlFor="guide-short">Contoh sampah</Label><Input id="guide-short" value={editing.short} onChange={(e) => setEditing({ ...editing, short: e.target.value })} /></div>}<div><Label htmlFor="guide-detail">Isi panduan</Label><Textarea id="guide-detail" rows={6} required value={editing.detail} onChange={(e) => setEditing({ ...editing, detail: e.target.value })} /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Batal</Button><Button type="submit" disabled={save.isPending}>Simpan panduan</Button></div></form>}</DialogContent></Dialog>
  </div>;
}
