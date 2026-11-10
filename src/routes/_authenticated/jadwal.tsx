import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { SearchBox, matchesQuery } from "@/components/search-box";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader, ScheduleRow, type Schedule } from "@/components/common";
import { dayName, scheduleDateLabel, sortByNext } from "@/lib/schedule";

export const Route = createFileRoute("/_authenticated/jadwal")({
  head: () => ({
    meta: [
      { title: "Jadwal Pengangkutan — Smart Waste Management" },
      { name: "description", content: "Jadwal pengangkutan sampah mingguan per wilayah." },
      { property: "og:title", content: "Jadwal Pengangkutan — Smart Waste Management" },
      { property: "og:description", content: "Jadwal pengangkutan sampah mingguan per wilayah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Jadwal,
});

function Jadwal() {
  const [q, setQ] = useState("");
  const now = new Date();
  const { data, isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => (await supabase.from("schedules").select("*")).data ?? [],
  });

  const sorted = sortByNext((data ?? []) as Schedule[], now).filter((s) =>
    matchesQuery(q, s.notes, dayName(s.day_of_week), scheduleDateLabel(s, now)),
  );
  const byDay = new Map<number, Schedule[]>();
  for (const s of sorted) {
    const list = byDay.get(s.day_of_week) ?? [];
    list.push(s);
    byDay.set(s.day_of_week, list);
  }

  return (
    <div>
      <PageHeader icon={CalendarDays} title="Jadwal Pengangkutan" text="Tanggal dan jam pengambilan sampah." />
      <SearchBox value={q} onChange={setQ} placeholder="Cari tanggal, hari, atau catatan…" />
      {isLoading && <p className="text-sm text-muted-foreground">Memuat jadwal…</p>}
      {!isLoading && sorted.length === 0 && (
        <EmptyState icon={CalendarDays} title="Belum ada jadwal" text="Jadwal pengangkutan akan diumumkan oleh petugas." />
      )}
      <div className="space-y-6">
        {[...byDay.entries()].map(([day, rows]) => (
          <section key={day}>
            <h2 className="mb-2 font-display text-lg font-semibold">{dayName(day)}</h2>
            <div className="space-y-2.5">
              {rows.map((s) => (
                <ScheduleRow key={s.id} s={s} now={now} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
