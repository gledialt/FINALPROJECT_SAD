import { useQuery } from "@tanstack/react-query";
import { MessageSquareReply, StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/common";
import { JENIS, KATEGORI, STATUS, STATUS_TONE, fmtDateTime, type FeedbackStatus } from "@/lib/feedback";
import type { Database } from "@/integrations/supabase/types";

export type FeedbackRow = Database["public"]["Tables"]["feedback"]["Row"];

export function FeedbackMeta({ f }: { f: FeedbackRow }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge tone={STATUS_TONE[f.status as FeedbackStatus]}>{STATUS[f.status as FeedbackStatus]}</StatusBadge>
      <StatusBadge tone="neutral">{JENIS[f.jenis_feedback as keyof typeof JENIS]}</StatusBadge>
      <StatusBadge tone="neutral">{KATEGORI[f.kategori as keyof typeof KATEGORI]}</StatusBadge>
    </div>
  );
}

export function FeedbackBody({ f }: { f: FeedbackRow }) {
  return (
    <div className="space-y-3">
      <FeedbackMeta f={f} />
      <p className="text-xs text-muted-foreground">Dikirim {fmtDateTime(f.created_at)}</p>
      <p className="whitespace-pre-line rounded-xl bg-muted/60 p-3 text-sm leading-relaxed">{f.isi_pesan}</p>
      {f.foto_url && <img src={f.foto_url} alt="Foto pendukung feedback" className="max-h-72 w-full rounded-xl object-contain bg-muted" />}
    </div>
  );
}

export function useReplies(id: string) {
  return useQuery({
    queryKey: ["feedback-replies", id],
    queryFn: async () => (await supabase.from("feedback_replies").select("*").eq("feedback_id", id).order("created_at")).data ?? [],
  });
}

export function RepliesList({ id }: { id: string }) {
  const { data } = useReplies(id);
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Tanggapan Admin</p>
      {(data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Belum ada tanggapan.</p>}
      {(data ?? []).map((r) => (
        <div key={r.id} className="rounded-xl border-l-4 border-brand-mid bg-brand-pale/50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand"><MessageSquareReply className="size-3.5" /> Admin · {fmtDateTime(r.created_at)}</p>
          <p className="mt-1 whitespace-pre-line text-sm">{r.isi_tanggapan}</p>
        </div>
      ))}
    </div>
  );
}

export function NotesList({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ["feedback-notes", id],
    queryFn: async () => (await supabase.from("feedback_internal_notes").select("*").eq("feedback_id", id).order("created_at")).data ?? [],
  });
  return (
    <div className="space-y-2">
      {(data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Belum ada catatan internal.</p>}
      {(data ?? []).map((n) => (
        <div key={n.id} className="rounded-xl bg-warning-soft/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-warning"><StickyNote className="size-3.5" /> {n.author_name || "Staf"} · {fmtDateTime(n.created_at)}</p>
          <p className="mt-1 whitespace-pre-line text-sm">{n.note}</p>
        </div>
      ))}
    </div>
  );
}
