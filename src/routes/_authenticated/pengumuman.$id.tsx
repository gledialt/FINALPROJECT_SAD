import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/common";
import { fmtDate } from "@/lib/schedule";

export const Route = createFileRoute("/_authenticated/pengumuman/$id")({
  head: () => ({
    meta: [
      { title: "Detail Pengumuman — Smart Waste Management" },
      { name: "description", content: "Isi lengkap pengumuman." },
      { property: "og:title", content: "Detail Pengumuman — Smart Waste Management" },
      { property: "og:description", content: "Isi lengkap pengumuman." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { data: a, isLoading } = useQuery({
    queryKey: ["announcement", id],
    queryFn: async () =>
      (await supabase.from("announcements").select("*").eq("id", id).eq("is_published", true).maybeSingle()).data,
  });

  return (
    <div>
      <Link to="/pengumuman" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-mid hover:text-brand">
        <ArrowLeft className="size-4" /> Semua Pengumuman
      </Link>
      {isLoading && <p className="text-sm text-muted-foreground">Memuat…</p>}
      {!isLoading && !a && (
        <EmptyState icon={Megaphone} title="Pengumuman tidak ditemukan" text="Mungkin sudah dihapus atau belum diterbitkan." />
      )}
      {a && (
        <article className="rounded-2xl border bg-card p-6 shadow-card">
          <p className="text-xs text-muted-foreground">{fmtDate(a.published_at ?? a.created_at)}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-snug">{a.title}</h1>
          {a.summary && <p className="mt-2 border-l-2 border-brand-soft pl-3 text-sm italic text-muted-foreground">{a.summary}</p>}
          <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground">{a.content}</div>
        </article>
      )}
    </div>
  );
}
