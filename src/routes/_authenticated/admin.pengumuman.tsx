import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SearchBox, matchesQuery } from "@/components/search-box";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { canManageOperations } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusBadge } from "@/components/common";
import { fmtDate } from "@/lib/schedule";

export const Route = createFileRoute("/_authenticated/admin/pengumuman")({
  head: () => ({
    meta: [
      { title: "Kelola Pengumuman — Smart Waste Management" },
      { name: "description", content: "Buat, ubah, dan hapus pengumuman." },
      { property: "og:title", content: "Kelola Pengumuman — Smart Waste Management" },
      { property: "og:description", content: "Buat, ubah, dan hapus pengumuman." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPengumuman,
});

type Form = { id?: string; title: string; summary: string; content: string; is_published: boolean };
const empty: Form = { title: "", summary: "", content: "", is_published: false };

function AdminPengumuman() {
  const { data: me } = useMe();
  const allowed = canManageOperations(me?.role);
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    enabled: allowed,
    queryKey: ["admin", "announcements"],
    queryFn: async () =>
      (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const save = useMutation({
    mutationFn: async (f: Form) => {
      const payload = {
        title: f.title,
        summary: f.summary,
        content: f.content,
        is_published: f.is_published,
        published_at: f.is_published ? new Date().toISOString() : null,
      };
      const { error } = f.id
        ? await supabase.from("announcements").update(payload).eq("id", f.id)
        : await supabase.from("announcements").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pengumuman disimpan");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pengumuman dihapus");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!allowed) return <p className="text-sm text-muted-foreground">Anda tidak memiliki akses pengelolaan.</p>;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <PageHeader icon={Megaphone} title="Kelola Pengumuman" text="Buat dan terbitkan pengumuman untuk warga." />
        <Button
          onClick={() => setForm(empty)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> Baru
        </Button>
      </div>

      {form && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form);
          }}
          className="mb-6 space-y-3 rounded-2xl border bg-card p-5 shadow-card"
        >
          <input
            required
            placeholder="Judul pengumuman"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <input
            placeholder="Ringkasan singkat"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <textarea
            required
            rows={5}
            placeholder="Isi pengumuman"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="size-4 accent-[var(--brand)]"
            />
            Terbitkan sekarang
          </label>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={save.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Simpan
            </Button>
            <Button type="button" onClick={() => setForm(null)} className="rounded-lg border px-4 py-2 text-sm font-semibold">
              Batal
            </Button>
          </div>
        </form>
      )}

      <SearchBox value={q} onChange={setQ} placeholder="Cari pengumuman…" />
      {isLoading && <p className="text-sm text-muted-foreground">Memuat…</p>}
      <div className="space-y-2.5">
        {(data ?? []).filter((a) => matchesQuery(q, a.title, a.summary, a.content)).map((a) => (
          <article key={a.id} className="flex items-start justify-between gap-3 rounded-2xl border bg-card p-4 shadow-card">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{a.title}</p>
                <StatusBadge tone={a.is_published ? "success" : "neutral"}>
                  {a.is_published ? "Terbit" : "Draf"}
                </StatusBadge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(a.published_at ?? a.created_at)}</p>
              {a.summary && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.summary}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                onClick={() =>
                  setForm({ id: a.id, title: a.title, summary: a.summary, content: a.content, is_published: a.is_published })
                }
                className="rounded-lg border p-2 text-muted-foreground hover:text-foreground"
                aria-label="Ubah"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                onClick={() => confirm("Hapus pengumuman ini?") && remove.mutate(a.id)}
                className="rounded-lg border p-2 text-danger hover:bg-danger-soft"
                aria-label="Hapus"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
