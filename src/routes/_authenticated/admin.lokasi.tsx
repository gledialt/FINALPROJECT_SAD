import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { canManageOperations } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common";

import { LocationMap } from "@/components/location-map";
import { LocationPointPicker } from "@/components/location-point-picker";
import { LocationInfo } from "@/components/location-info";

export const Route = createFileRoute("/_authenticated/admin/lokasi")({
  head: () => ({
    meta: [
      { title: "Kelola Lokasi — Smart Waste Management" },
      { name: "description", content: "Atur lokasi tempat pengelolaan sampah." },
      { property: "og:title", content: "Kelola Lokasi — Smart Waste Management" },
      { property: "og:description", content: "Atur lokasi tempat pengelolaan sampah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLokasi,
});

type Form = {
  id?: string;
  name: string;
  address: string;
  description: string;
  latitude: string;
  longitude: string;
  is_verified: boolean;
  schedule_title: string;
  schedule_date: string;
  schedule_time: string;
  activity_status: string;
};
const empty: Form = { name: "", address: "", description: "", latitude: "", longitude: "", is_verified: false, schedule_title: "Jadwal Pengangkutan", schedule_date: "", schedule_time: "", activity_status: "" };

function AdminLokasi() {
  const { data: me } = useMe();
  const allowed = canManageOperations(me?.role);
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);

  const { data, isLoading } = useQuery({
    enabled: allowed,
    queryKey: ["admin", "locations"],
    queryFn: async () => (await supabase.from("locations").select("*").order("name")).data ?? [],
  });

  const save = useMutation({
    mutationFn: async (f: Form) => {
      const payload = {
        name: f.name,
        address: f.address,
        description: f.description || null,
        latitude: f.latitude ? Number(f.latitude) : null,
        longitude: f.longitude ? Number(f.longitude) : null,
        is_verified: f.is_verified,
        schedule_title: f.schedule_title || null,
        schedule_date: f.schedule_date || null,
        schedule_time: f.schedule_time || null,
        activity_status: f.activity_status || null,
      };
      const { error } = f.id
        ? await supabase.from("locations").update(payload).eq("id", f.id)
        : await supabase.from("locations").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lokasi disimpan");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin", "locations"] });
      qc.invalidateQueries({ queryKey: ["locations"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lokasi dihapus");
      qc.invalidateQueries({ queryKey: ["admin", "locations"] });
      qc.invalidateQueries({ queryKey: ["locations"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!allowed) return <p className="text-sm text-muted-foreground">Anda tidak memiliki akses pengelolaan.</p>;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <PageHeader icon={MapPin} title="Kelola Lokasi" text="Tambah dan verifikasi titik pengelolaan sampah." />
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
          <input
            required
            placeholder="Nama lokasi"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border bg-background px-3 py-2 text-sm sm:col-span-2"
          />
          <textarea
            required
            rows={2}
            placeholder="Alamat"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="rounded-lg border bg-background px-3 py-2 text-sm sm:col-span-2"
          />
          <LocationPointPicker latitude={form.latitude} longitude={form.longitude} onChange={(latitude, longitude) => setForm((current) => current ? { ...current, latitude, longitude } : null)} />
          <input
            aria-label="Latitude"
            type="number" min={-90} max={90} step="any"
            placeholder="Latitude (opsional)"
            inputMode="decimal"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <input
            aria-label="Longitude"
            type="number" min={-180} max={180} step="any"
            placeholder="Longitude (opsional)"
            inputMode="decimal"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <textarea
            rows={2}
            placeholder="Keterangan singkat (mis. Lokasi Pengangkutan)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-lg border bg-background px-3 py-2 text-sm sm:col-span-2"
          />
          <div className="grid gap-3 rounded-xl bg-brand-pale p-4 sm:col-span-2 sm:grid-cols-2">
            <p className="text-sm font-semibold sm:col-span-2">Jadwal & keterangan aktivitas (opsional)</p>
            <input placeholder="Judul (mis. Jadwal Pengangkutan)" value={form.schedule_title} onChange={(e) => setForm({ ...form, schedule_title: e.target.value })} className="rounded-lg border bg-background px-3 py-2 text-sm" />
            <input placeholder="Hari & tanggal (mis. Senin, 28 April 2025)" value={form.schedule_date} onChange={(e) => setForm({ ...form, schedule_date: e.target.value })} className="rounded-lg border bg-background px-3 py-2 text-sm" />
            <input placeholder="Jam (mis. 08.00 – 10.00 WITA)" value={form.schedule_time} onChange={(e) => setForm({ ...form, schedule_time: e.target.value })} className="rounded-lg border bg-background px-3 py-2 text-sm" />
            <select aria-label="Keterangan aktivitas" value={form.activity_status} onChange={(e) => setForm({ ...form, activity_status: e.target.value })} className="rounded-lg border bg-background px-3 py-2 text-sm">
              <option value="">Tanpa keterangan</option>
              <option value="Akan datang">Akan datang</option>
              <option value="Berlangsung">Berlangsung</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditunda">Ditunda</option>
            </select>
          </div>
          <label className="flex w-fit items-center gap-2 text-sm font-medium sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_verified}
              onChange={(e) => setForm({ ...form, is_verified: e.target.checked })}
              className="!size-4 !w-4 shrink-0 accent-[var(--brand)]"
            />
            Terverifikasi
          </label>
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

      {isLoading && <p className="text-sm text-muted-foreground">Memuat…</p>}
      {data && <LocationMap locations={data} actions={(l) => <>
        <Button variant="outline" size="icon" title="Ubah lokasi" aria-label={`Ubah ${l.name}`} onClick={() => setForm({ id: l.id, name: l.name, address: l.address, description: l.description ?? "", latitude: l.latitude?.toString() ?? "", longitude: l.longitude?.toString() ?? "", is_verified: l.is_verified, schedule_title: l.schedule_title ?? "", schedule_date: l.schedule_date ?? "", schedule_time: l.schedule_time ?? "", activity_status: l.activity_status ?? "" })}><Pencil className="size-4" /></Button>
        <Button variant="outline" size="icon" title="Hapus lokasi" aria-label={`Hapus ${l.name}`} onClick={() => confirm("Hapus lokasi ini?") && remove.mutate(l.id)} className="text-danger"><Trash2 className="size-4" /></Button>
      </>} />}
      <LocationInfo />

    </div>
  );
}
