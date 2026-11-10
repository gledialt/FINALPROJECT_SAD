import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Loader2, MessageSquareHeart, Search, Send } from "lucide-react";
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
import { JENIS, KATEGORI, STATUS, canAddInternalNote, canReplyFeedback, canViewAllFeedback, fmtDateTime, type FeedbackStatus } from "@/lib/feedback";
import { FeedbackBody, FeedbackMeta, NotesList, RepliesList, type FeedbackRow } from "@/components/feedback-thread";
import { DeleteFeedbackButton } from "@/components/feedback-delete";

export const Route = createFileRoute("/_authenticated/admin/feedback")({
  head: () => ({
    meta: [
      { title: "Kelola Feedback — Smart Waste Management" },
      { name: "description", content: "Tinjau dan tanggapi feedback masyarakat." },
      { property: "og:title", content: "Kelola Feedback — Smart Waste Management" },
      { property: "og:description", content: "Tinjau dan tanggapi feedback masyarakat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminFeedback,
});

type Sender = { id: string; full_name: string; email: string | null };

function AdminFeedback() {
  const { data: me } = useMe();
  const [q, setQ] = useState("");
  const [jenis, setJenis] = useState("all");
  const [kat, setKat] = useState("all");
  const [status, setStatus] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["feedback", "all"],
    queryFn: async () => {
      const list = (await supabase.from("feedback").select("*").order("created_at", { ascending: false })).data ?? [];
      const ids = [...new Set(list.map((f) => f.user_id))];
      const senders = ids.length ? ((await supabase.from("profiles").select("id, full_name, email").in("id", ids)).data ?? []) : [];
      return { list, senders: Object.fromEntries(senders.map((s) => [s.id, s])) as Record<string, Sender> };
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.list ?? []).filter((f) => {
      const name = data?.senders[f.user_id]?.full_name ?? "";
      return (!term || f.judul.toLowerCase().includes(term) || name.toLowerCase().includes(term)) &&
        (jenis === "all" || f.jenis_feedback === jenis) && (kat === "all" || f.kategori === kat) && (status === "all" || f.status === status);
    });
  }, [data, q, jenis, kat, status]);

  if (me && !canViewAllFeedback(me.role)) return <EmptyState icon={MessageSquareHeart} title="Tidak ada akses" />;
  const counts = (s: FeedbackStatus) => (data?.list ?? []).filter((f) => f.status === s).length;
  const open = data?.list.find((f) => f.id === openId) ?? null;

  return (
    <div className="space-y-5">
      <SectionHead title={me?.role === "admin" ? "Kelola Feedback" : "Feedback Masyarakat"} eyebrow="Suara warga" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(STATUS) as FeedbackStatus[]).map((s, i) => (
          <div key={s} className={`feature-tile tile-${i} rounded-2xl border bg-card p-4 shadow-card`}>
            <p className="text-xs text-muted-foreground">{STATUS[s]}</p>
            <p className="font-display text-2xl font-semibold">{counts(s)}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <div className="relative sm:col-span-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau judul" className="pl-9" />
        </div>
        {me?.role === "admin" && <Filter value={jenis} onChange={setJenis} all="Semua jenis" opts={JENIS} />}
        <Filter value={kat} onChange={setKat} all="Semua kategori" opts={KATEGORI} />
        <Filter value={status} onChange={setStatus} all="Semua status" opts={STATUS} />
      </div>
      <div className="space-y-2.5">
        {filtered.length === 0 && <EmptyState icon={MessageSquareHeart} title="Belum ada feedback" />}
        {filtered.map((f) => (
          <button key={f.id} onClick={() => setOpenId(f.id)} className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-card transition hover:bg-muted/40">
            {!f.is_read && <span className="size-2.5 shrink-0 rounded-full bg-danger" aria-label="Belum dibaca" />}
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className={`truncate ${f.is_read ? "font-medium" : "font-bold"}`}>{f.judul}</p>
              <p className="text-xs text-muted-foreground">{data?.senders[f.user_id]?.full_name || "Warga"} · {fmtDateTime(f.created_at)}</p>
              <FeedbackMeta f={f} />
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {open && me && <Detail f={open} sender={data?.senders[open.user_id]} role={me.role} myId={me.id} myName={me.profile?.full_name ?? me.email} />}
          {open && me?.role === "admin" && <DeleteFeedbackButton id={open.id} onDeleted={() => setOpenId(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Filter({ value, onChange, all, opts }: { value: string; onChange: (v: string) => void; all: string; opts: Record<string, string> }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{all}</SelectItem>
        {Object.entries(opts).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function Detail({ f, sender, role, myId, myName }: { f: FeedbackRow; sender: Sender | undefined; role: "admin" | "petugas" | "masyarakat"; myId: string; myName: string }) {
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const isAdmin = canReplyFeedback(role);
  const refresh = () => qc.invalidateQueries({ queryKey: ["feedback"] });

  const update = useMutation({
    mutationFn: async (patch: { status?: string; is_read?: boolean }) => {
      const { error } = await supabase.from("feedback").update(patch).eq("id", f.id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: () => toast.error("Gagal memperbarui feedback."),
  });
  const sendReply = useMutation({
    mutationFn: async () => {
      const text = reply.trim();
      if (!text) throw new Error("Tulis tanggapan terlebih dahulu.");
      const { error } = await supabase.from("feedback_replies").insert({ feedback_id: f.id, admin_id: myId, isi_tanggapan: text.slice(0, 3000) });
      if (error) throw new Error("Tanggapan gagal dikirim.");
      if (f.status === "baru" || f.status === "diproses") await supabase.from("feedback").update({ status: "dibalas", is_read: true }).eq("id", f.id);
    },
    onSuccess: () => { toast.success("Tanggapan tersimpan."); setReply(""); refresh(); qc.invalidateQueries({ queryKey: ["feedback-replies", f.id] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const addNote = useMutation({
    mutationFn: async () => {
      const text = note.trim();
      if (!text) throw new Error("Tulis catatan terlebih dahulu.");
      const { error } = await supabase.from("feedback_internal_notes").insert({ feedback_id: f.id, author_id: myId, author_name: myName, note: text.slice(0, 2000) });
      if (error) throw new Error("Catatan gagal disimpan.");
    },
    onSuccess: () => { toast.success("Catatan internal tersimpan."); setNote(""); qc.invalidateQueries({ queryKey: ["feedback-notes", f.id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <DialogHeader><DialogTitle>{f.judul}</DialogTitle></DialogHeader>
      <div className="rounded-xl border p-3 text-sm">
        <p className="font-semibold">{sender?.full_name || "Warga"}</p>
        {isAdmin && <p className="text-muted-foreground">{sender?.email}</p>}
      </div>
      <FeedbackBody f={f} />
      {isAdmin && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-40 flex-1 space-y-1.5">
            <Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => v !== f.status && update.mutate({ status: v, is_read: true })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => update.mutate({ is_read: !f.is_read })}>{f.is_read ? "Tandai belum dibaca" : "Tandai sudah dibaca"}</Button>
        </div>
      )}
      <RepliesList id={f.id} />
      {isAdmin && (
        <div className="space-y-2">
          <Label>Balas Feedback</Label>
          <Textarea rows={3} maxLength={3000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Tulis tanggapan resmi untuk warga" />
          <Button onClick={() => sendReply.mutate()} disabled={sendReply.isPending}>
            {sendReply.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Kirim Tanggapan
          </Button>
        </div>
      )}
      {canAddInternalNote(role) && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-sm font-semibold">Catatan Internal <span className="font-normal text-muted-foreground">(tidak terlihat oleh warga)</span></p>
          <NotesList id={f.id} />
          <Textarea rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tambahkan catatan untuk tim" />
          <Button variant="outline" onClick={() => addNote.mutate()} disabled={addNote.isPending}>Simpan Catatan</Button>
        </div>
      )}
    </>
  );
}
