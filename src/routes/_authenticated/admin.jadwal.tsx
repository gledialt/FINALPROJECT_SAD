import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SearchBox, matchesQuery } from "@/components/search-box";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { canManageOperations } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common";
import { dayName, fmtTime, isoDay, scheduleDateLabel } from "@/lib/schedule";

export const Route = createFileRoute("/_authenticated/admin/jadwal")({
  head: () => ({
    meta: [
      { title: "Kelola Jadwal — Smart Waste Management" },
      { name: "description", content: "Atur tanggal dan jam pengangkutan sampah." },
      { property: "og:title", content: "Kelola Jadwal — Smart Waste Management" },
      { property: "og:description", content: "Atur tanggal dan jam pengangkutan sampah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminJadwal,
});

type Form = { id?: string; day_of_week: number; start_time: string; end_time: string; notes: string; schedule_date: string };
const empty: Form = { day_of_week: 1, start_time: "07:00", end_time: "", notes: "", schedule_date: "" };

/** Picking a transport date also decides which weekday the row belongs to. */
function withDate(f: Form, schedule_date: string): Form {
  return {
    ...f,
    schedule_date,
    day_of_week: schedule_date ? isoDay(new Date(`${schedule_date}T12:00:00`)) : f.day_of_week,
  };
}

function AdminJadwal() {
  const { data: me } = useMe();
  const allowed = canManageOperations(me?.role);
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    enabled: allowed,
    queryKey: ["admin", "schedules"],
    queryFn: async () =>
      (
        await supabase
          .from("schedules")
          .select("*")
          .order("schedule_date", { ascending: true, nullsFirst: false })
          .order("day_of_week")
          .order("start_time")
      ).data ?? [],
  });

  const save = useMutation({
    mutationFn: async (f: Form) => {
      const payload = {
        day_of_week: f.day_of_week,
        start_time: f.start_time,
        end_time: f.end_time || null,
        notes: f.notes || null,
        schedule_date: f.schedule_date || null,
      };
      const { error } = f.id
        ? await supabase.from("schedules").update(payload).eq("id", f.id)
        : await supabase.from("schedules").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Jadwal disimpan");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin", "schedules"] });
      qc.invalidateQueries({ queryKey: ["schedules"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Jadwal dihapus");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin", "schedules"] });
      qc.invalidateQueries({ queryKey: ["schedules"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!allowed) return <p className="text-sm text-muted-foreground">Anda tidak memiliki akses pengelolaan.</p>;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <PageHeader icon={CalendarDays} title="Kelola Jadwal" text="Atur tanggal dan jam pengangkutan sampah." />
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
          className="form-panel mb-6 grid min-w-0 gap-3 rounded-2xl border bg-card p-4 shadow-card sm:grid-cols-2 sm:p-5 [&>*]:min-w-0 [&_input]:min-w-0 [&_input]:w-full [&_select]:w-full"
        >
          <label className="text-sm font-medium sm:col-span-2">Tanggal pengangkutan
            <input
              required
              aria-label="Tanggal pengangkutan"
              type="date"
              value={form.schedule_date}
              onChange={(e) => setForm(withDate(form, e.target.value))}
              className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium">Jam mulai
            <input
              required
              aria-label="Jam mulai"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-medium">Jam selesai (opsional)
            <input
              aria-label="Jam selesai"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="mt-1 block w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </label>
          <input
            placeholder="Catatan (opsional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="rounded-lg border bg-background px-3 py-2 text-sm sm:col-span-2"
          />
          <div className="flex gap-2 sm:col-span-2">
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

      <SearchBox value={q} onChange={setQ} placeholder="Cari tanggal, hari, atau catatan…" />
      {isLoading && <p className="text-sm text-muted-foreground">Memuat…</p>}
      <div className="space-y-2.5">
        {(data ?? [])
          .filter((s) => matchesQuery(q, s.notes, dayName(s.day_of_week), scheduleDateLabel(s, new Date())))
          .map((s) => (
            <article key={s.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-card">
              <div className="min-w-0">
                <p className="font-semibold">
                  {scheduleDateLabel(s, new Date())}
                  {!s.schedule_date && " · Setiap minggu"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {dayName(s.day_of_week)}, {fmtTime(s.start_time)}
                  {s.end_time ? `–${fmtTime(s.end_time)}` : ""}
                  {s.notes ? ` · ${s.notes}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  onClick={() =>
                    setForm({
                      id: s.id,
                      day_of_week: s.day_of_week,
                      start_time: fmtTime(s.start_time),
                      end_time: fmtTime(s.end_time),
                      notes: s.notes ?? "",
                      schedule_date: s.schedule_date ?? "",
                    })
                  }
                  className="rounded-lg border p-2 text-muted-foreground hover:text-foreground"
                  aria-label="Ubah"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  onClick={() => confirm("Hapus jadwal ini?") && remove.mutate(s.id)}
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
