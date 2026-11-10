import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { SearchBox, matchesQuery } from "@/components/search-box";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnnouncementItem, EmptyState, PageHeader, type Announcement } from "@/components/common";

export const Route = createFileRoute("/_authenticated/pengumuman/")({
  head: () => ({
    meta: [
      { title: "Pengumuman — Smart Waste Management" },
      { name: "description", content: "Pengumuman resmi seputar pengelolaan sampah lingkungan." },
      { property: "og:title", content: "Pengumuman — Smart Waste Management" },
      { property: "og:description", content: "Pengumuman resmi seputar pengelolaan sampah lingkungan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pengumuman,
});

function Pengumuman() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["announcements", "published", "all"],
    queryFn: async () =>
      (
        await supabase
          .from("announcements")
          .select("id,title,summary,published_at,created_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
      ).data ?? [],
  });

  return (
    <div>
      <PageHeader icon={Megaphone} title="Pengumuman" text="Informasi resmi dari pengelola lingkungan." />
      <SearchBox value={q} onChange={setQ} placeholder="Cari pengumuman…" />
      {isLoading && <p className="text-sm text-muted-foreground">Memuat pengumuman…</p>}
      {!isLoading && (data ?? []).length === 0 && (
        <EmptyState icon={Megaphone} title="Belum ada pengumuman" text="Pengumuman baru akan tampil di sini." />
      )}
      <div className="space-y-2.5">
        {(data ?? []).filter((a) => matchesQuery(q, a.title, a.summary)).map((a) => (
          <AnnouncementItem key={a.id} a={a as Announcement} />
        ))}
      </div>
    </div>
  );
}
