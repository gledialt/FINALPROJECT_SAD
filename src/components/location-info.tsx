import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { canManageOperations } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const KEY = "lokasi_info";

/** Information banner shown under the location map; editable by admin and petugas. */
export function LocationInfo() {
  const { data: me } = useMe();
  const canEdit = canManageOperations(me?.role, "locations");
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ title: string; content: string } | null>(null);
  const { data } = useQuery({
    queryKey: ["app-info", KEY],
    queryFn: async () => (await supabase.from("app_info").select("*").eq("key", KEY).maybeSingle()).data,
  });
  const save = useMutation({
    mutationFn: async (v: { title: string; content: string }) => {
      const { error } = await supabase.from("app_info").upsert({ key: KEY, title: v.title.trim(), content: v.content.trim(), updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["app-info", KEY] }); setEditing(null); toast.success("Informasi diperbarui."); },
    onError: (e) => toast.error(e.message),
  });
  if (!data && !canEdit) return null;
  const title = data?.title || "Informasi";
  const content = data?.content || "";
  return (
    <section className="info-banner mt-6 flex items-start gap-4 rounded-2xl border p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand"><Info className="size-6" /></span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{content || "Belum ada informasi."}</p>
      </div>
      {canEdit && <Button size="icon" variant="outline" aria-label="Ubah informasi" onClick={() => setEditing({ title, content })}><Pencil className="size-4" /></Button>}
      <Dialog open={Boolean(editing)} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ubah informasi lokasi</DialogTitle><DialogDescription>Teks ini tampil di bawah peta lokasi pengelolaan.</DialogDescription></DialogHeader>
          {editing && (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }}>
              <div><Label htmlFor="info-title">Judul</Label><Input id="info-title" required maxLength={100} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label htmlFor="info-content">Isi informasi</Label><Textarea id="info-content" rows={5} required maxLength={1000} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Batal</Button><Button type="submit" disabled={save.isPending}>Simpan</Button></div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
