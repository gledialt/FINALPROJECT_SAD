import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Workflow } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SearchBox, matchesQuery } from "@/components/search-box";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { canManageOperations } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common";

export const Route = createFileRoute("/_authenticated/admin/proses")({
  head: () => ({
    meta: [
      { title: "Kelola Proses Pengelolaan — Smart Waste Management" },
      { name: "description", content: "Atur langkah-langkah proses pengelolaan sampah." },
      { property: "og:title", content: "Kelola Proses Pengelolaan — Smart Waste Management" },
      { property: "og:description", content: "Atur langkah-langkah proses pengelolaan sampah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminProses,
});

type Form = { id?: string; title: string; description: string; step_order: number };
const empty: Form = { title: "", description: "", step_order: 1 };

function AdminProses() {
  const { data: me } = useMe();
  const allowed = canManageOperations(me?.role, "processes");
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    enabled: allowed,
    queryKey: ["admin", "processes"],
    queryFn: async () => (await supabase.from("processes").select("*").order("step_order")).data ?? [],
  });

  const save = useMutation({
    mutationFn: async (f: Form) => {
      const payload = { title: f.title, description: f.description, step_order: f.step_order };
      const { error } = f.id
        ? await supabase.from("processes").update(payload).eq("id", f.id)
        : await supabase.from("processes").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Langkah disimpan");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin", "processes"] });
      qc.invalidateQueries({ queryKey: ["processes"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("processes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Langkah dihapus");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin", "processes"] });
      qc.invalidateQueries({ queryKey: ["processes"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!allowed) return <p className="text-sm text-muted-foreground">Anda tidak memiliki akses pengelolaan.</p>;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <PageHeader icon={Workflow} title="Kelola Proses Pengelolaan" text="Atur alur pengelolaan sampah yang ditampilkan ke warga." />
        <Button
          onClick={() => setForm({ ...empty, step_order: (data?.length ?? 0) + 1 })}
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
          <div className="flex gap-3">
            <input
              required
              type="number"
              min={1}
              value={form.step_order}
              onChange={(e) => setForm({ ...form, step_order: Number(e.target.value) })}
              className="w-24 rounded-lg border bg-background px-3 py-2 text-sm"
              aria-label="Urutan"
            />
            <input
              required
              placeholder="Judul langkah"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <textarea
            required
            rows={3}
            placeholder="Deskripsi langkah"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
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

      <SearchBox value={q} onChange={setQ} placeholder="Cari proses pengelolaan…" />
      {isLoading && <p className="text-sm text-muted-foreground">Memuat…</p>}
      <div className="space-y-2.5">
        {(data ?? []).filter((p) => matchesQuery(q, p.title, p.description)).map((p) => (
          <article key={p.id} className="flex items-start justify-between gap-3 rounded-2xl border bg-card p-4 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-on-brand">
                {p.step_order}
              </span>
              <div>
                <p className="font-semibold">{p.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{p.description}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                onClick={() => setForm({ id: p.id, title: p.title, description: p.description, step_order: p.step_order })}
                className="rounded-lg border p-2 text-muted-foreground hover:text-foreground"
                aria-label="Ubah"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                onClick={() => confirm("Hapus langkah ini?") && remove.mutate(p.id)}
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
