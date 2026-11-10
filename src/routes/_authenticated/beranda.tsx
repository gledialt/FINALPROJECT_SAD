import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, ChevronRight, MapPin, Megaphone, Pencil, Users, Workflow, MessageSquareHeart, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AnnouncementItem, ScheduleRow, SectionHead, type Announcement, type Schedule } from "@/components/common";
import { CATEGORIES } from "@/components/waste-categories";
import { firstName, useMe, type AppRole } from "@/lib/session";
import community from "@/assets/community-clean.jpg";
import { Button } from "@/components/ui/button";
import { sortByNext, occurrenceDate } from "@/lib/schedule";
import { guidesQuery } from "@/lib/guides";

export const Route = createFileRoute("/_authenticated/beranda")({
  head: () => ({
    meta: [
      { title: "Beranda — Smart Waste Management" },
      { name: "description", content: "Ringkasan jadwal pengangkutan, pengumuman, dan panduan pemilahan sampah." },
      { property: "og:title", content: "Beranda — Smart Waste Management" },
      { property: "og:description", content: "Ringkasan jadwal pengangkutan, pengumuman, dan panduan pemilahan sampah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Beranda,
});

type To = "/admin/pengumuman" | "/admin/proses" | "/admin/jadwal" | "/admin/lokasi" | "/admin/pengguna" | "/panduan" | "/pengumuman" | "/proses" | "/jadwal" | "/lokasi" | "/feedback" | "/admin/feedback";
type Feature = { to: To; label: string; text: string; icon: LucideIcon };

const FEATURES: Record<AppRole, Feature[]> = {
  admin: [
    { to: "/admin/pengumuman", label: "Pengumuman", text: "Buat & terbitkan", icon: Megaphone },
    { to: "/admin/proses", label: "Proses Pengelolaan", text: "Atur alur", icon: Workflow },
    { to: "/admin/jadwal", label: "Jadwal Pengangkutan", text: "Atur jadwal", icon: CalendarDays },
    { to: "/admin/lokasi", label: "Lokasi Pengelolaan", text: "Peta & info", icon: MapPin },
    { to: "/admin/pengguna", label: "Kelola Pengguna", text: "Akun & peran", icon: Users },
    { to: "/admin/feedback", label: "Kelola Feedback", text: "Suara warga", icon: MessageSquareHeart },
  ],
  petugas: [
    { to: "/admin/pengumuman", label: "Pengumuman", text: "Buat & terbitkan", icon: Megaphone },
    { to: "/admin/jadwal", label: "Jadwal Pengangkutan", text: "Atur jadwal", icon: CalendarDays },
    { to: "/admin/lokasi", label: "Lokasi Pengelolaan", text: "Peta & info", icon: MapPin },
    { to: "/admin/feedback", label: "Feedback Masyarakat", text: "Tinjau laporan", icon: MessageSquareHeart },
  ],
  masyarakat: [
    { to: "/pengumuman", label: "Pengumuman", text: "Info terbaru", icon: Megaphone },
    { to: "/proses", label: "Proses Pengelolaan", text: "Alur sampah", icon: Workflow },
    { to: "/jadwal", label: "Jadwal Pengangkutan", text: "Hari & jam", icon: CalendarDays },
    { to: "/lokasi", label: "Lokasi Pengelolaan", text: "Peta lokasi", icon: MapPin },
    { to: "/feedback", label: "Feedback", text: "Keluhan & saran", icon: MessageSquareHeart },
  ],
};

function Beranda() {
  const { data: me } = useMe();
  const now = new Date();
  const role = me?.role ?? "masyarakat";
  const { data: guides } = useQuery(guidesQuery);

  const { data: schedules } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => (await supabase.from("schedules").select("*")).data ?? [],
  });
  const { data: announcements } = useQuery({
    queryKey: ["announcements", "published"],
    queryFn: async () =>
      (
        await supabase
          .from("announcements")
          .select("id,title,summary,published_at,created_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(3)
      ).data ?? [],
  });

  const next = sortByNext((schedules ?? []) as Schedule[], now).filter((s) => occurrenceDate(s, now) >= now).slice(0, 2);
  const tips = guides?.find((g) => g.key === "tips");
  const scheduleLink: To = role === "masyarakat" ? "/jadwal" : "/admin/jadwal";
  const announcementLink: To = role === "masyarakat" ? "/pengumuman" : "/admin/pengumuman";

  return (
    <div className="space-y-8">
      <section className="page-enter relative overflow-hidden rounded-2xl bg-brand-deep text-on-brand">
        <img src={community} alt="Kegiatan pemilahan sampah bersama warga dan petugas" width={1536} height={1024} className="role-photo absolute inset-0 h-full w-full object-cover" />
        <div className="photo-shade absolute inset-0" />
        <div className="relative max-w-xl px-6 py-9 md:px-8 md:py-11">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-brand-muted">RW 10 Airmadidi Atas</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">Halo, {firstName(me?.profile?.full_name)}</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-on-brand-muted">Lingkungan bersih dimulai dari kita. Bersama menjaga lingkungan yang sehat dan nyaman.</p>
        </div>
      </section>

      <section>
        <SectionHead title="Fitur" eyebrow="Menu" />
        <div className="grid grid-cols-2 auto-rows-fr gap-3">
          {FEATURES[role].map((f, index) => (
            <Link key={f.to} to={f.to} style={{ animationDelay: `${index * 70}ms` }} className={`feature-tile tile-${index % 5} flex min-h-24 min-w-0 flex-col items-start gap-2 rounded-2xl border bg-card p-3 shadow-card sm:flex-row sm:items-center sm:gap-3 sm:p-4 ${FEATURES[role].length % 2 === 1 && index === FEATURES[role].length - 1 ? "col-span-2" : ""}`}>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl tile-icon"><f.icon className="size-5" /></span>
              <span className="w-full min-w-0">
                <span className="block break-words text-sm font-semibold leading-tight [hyphens:auto]">{f.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{f.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHead title="Jadwal Terdekat" eyebrow="Pengangkutan" action={<MoreLink to={scheduleLink} />} />
        <div className="space-y-2.5">
          {next.length === 0 && <p className="rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">Belum ada jadwal yang tercatat.</p>}
          {next.map((s, i) => <ScheduleRow key={s.id} s={s} now={now} highlight={i === 0} />)}
        </div>
      </section>

      <section>
        <SectionHead
          title="Panduan Pemilahan"
          eyebrow="Pilah sampah Anda"
          action={role === "admin" ? <Button asChild size="sm" variant="outline"><Link to="/panduan"><Pencil className="size-4" /> Edit panduan</Link></Button> : undefined}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {CATEGORIES.map((c) => {
            const g = guides?.find((x) => x.key === c.key);
            return (
              <article key={c.key} className="guide-item fade-up rounded-2xl border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-on-brand ${c.color}`}><c.icon className="size-5" /></span>
                  <div className="min-w-0">
                    <p className="font-semibold">{g?.name ?? c.name}</p>
                    <p className="text-xs text-muted-foreground">{g?.short ?? c.short}</p>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{g?.detail ?? c.detail}</p>
              </article>
            );
          })}
        </div>
        {tips && (
          <div className="mt-4 rounded-2xl border bg-card p-5 shadow-card">
            <p className="font-display text-lg font-semibold text-brand">{tips.name}</p>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {tips.detail.split("\n").filter(Boolean).map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-mid" />{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <SectionHead title="Pengumuman" eyebrow="Terbaru" action={<MoreLink to={announcementLink} />} />
        <div className="space-y-2.5">
          {(announcements ?? []).length === 0 && <p className="rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">Belum ada pengumuman.</p>}
          {(announcements ?? []).map((a) => <AnnouncementItem key={a.id} a={a as Announcement} />)}
        </div>
      </section>
    </div>
  );
}

function MoreLink({ to }: { to: To }) {
  return (
    <Link to={to} className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand-mid hover:text-brand">
      Lihat Semua <ChevronRight className="size-4" />
    </Link>
  );
}
