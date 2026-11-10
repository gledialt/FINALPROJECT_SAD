import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Workflow } from "lucide-react";
import { SearchBox, matchesQuery } from "@/components/search-box";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader } from "@/components/common";

export const Route = createFileRoute("/_authenticated/proses")({
  head: () => ({
    meta: [
      { title: "Proses Pengelolaan — Smart Waste Management" },
      { name: "description", content: "Alur proses pengelolaan sampah dari rumah hingga tempat pemrosesan akhir." },
      { property: "og:title", content: "Proses Pengelolaan — Smart Waste Management" },
      { property: "og:description", content: "Alur proses pengelolaan sampah dari rumah hingga tempat pemrosesan akhir." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Proses,
});

function Proses() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["processes"],
    queryFn: async () => (await supabase.from("processes").select("*").order("step_order")).data ?? [],
  });

  return (
    <div>
      <PageHeader icon={Workflow} title="Proses Pengelolaan" text="Bagaimana sampah Anda dikelola, langkah demi langkah." />
      <SearchBox value={q} onChange={setQ} placeholder="Cari proses pengelolaan…" />
      {isLoading && <p className="text-sm text-muted-foreground">Memuat proses…</p>}
      {!isLoading && (data ?? []).length === 0 && (
        <EmptyState icon={Workflow} title="Belum ada data" text="Alur proses akan ditambahkan oleh petugas." />
      )}
      <ol className="relative space-y-4 border-l-2 border-brand-soft/60 pl-6">
        {(data ?? []).filter((p) => matchesQuery(q, p.title, p.description)).map((p, i) => (
          <li key={p.id} className="relative">
            <span className="absolute -left-[35px] flex size-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-on-brand">
              {i + 1}
            </span>
            <div className="rounded-2xl border bg-card p-4 shadow-card">
              <p className="font-semibold">{p.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
