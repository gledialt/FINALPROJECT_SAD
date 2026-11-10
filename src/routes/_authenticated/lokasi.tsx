import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader } from "@/components/common";

import { LocationMap } from "@/components/location-map";
import { LocationInfo } from "@/components/location-info";

export const Route = createFileRoute("/_authenticated/lokasi")({
  head: () => ({
    meta: [
      { title: "Lokasi Pengelolaan — Smart Waste Management" },
      { name: "description", content: "Daftar lokasi tempat pembuangan dan pengelolaan sampah." },
      { property: "og:title", content: "Lokasi Pengelolaan — Smart Waste Management" },
      { property: "og:description", content: "Daftar lokasi tempat pembuangan dan pengelolaan sampah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lokasi,
});

function Lokasi() {
  const { data, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await supabase.from("locations").select("*").order("name")).data ?? [],
  });

  return (
    <div>
      <PageHeader icon={MapPin} title="Lokasi Pengelolaan" text="Titik pembuangan dan pengelolaan sampah di lingkungan kita." />
      {isLoading && <p className="text-sm text-muted-foreground">Memuat lokasi…</p>}
      {!isLoading && (data ?? []).length === 0 && (
        <EmptyState icon={MapPin} title="Belum ada lokasi" text="Lokasi pengelolaan akan ditambahkan oleh petugas." />
      )}
      {data && data.length > 0 && <LocationMap locations={data} />}
      <LocationInfo />
    </div>
  );
}
