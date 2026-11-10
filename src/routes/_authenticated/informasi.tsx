import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, CalendarDays, ChevronRight, Info, MapPin, Megaphone, Target, Users, Workflow } from "lucide-react";
import { PageHeader } from "@/components/common";

export const Route = createFileRoute("/_authenticated/informasi")({
  head: () => ({
    meta: [
      { title: "Informasi — Smart Waste Management" },
      { name: "description", content: "Informasi tentang Smart Waste Management System RW 10 Airmadidi Atas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "Tentang Smart Waste Management" },
      { property: "og:description", content: "Tujuan, fitur, dan pengelola sistem informasi pengelolaan sampah." },
    ],
  }),
  component: Informasi,
});

const FITUR = [
  { icon: CalendarDays, t: "Jadwal Pengangkutan", d: "Hari dan jam pengangkutan sampah tiap wilayah." },
  { icon: Megaphone, t: "Pengumuman", d: "Informasi resmi dari pengurus pengelolaan sampah." },
  { icon: MapPin, t: "Lokasi Pengelolaan", d: "Titik pengelolaan sampah dan TPA terdekat." },
  { icon: Workflow, t: "Proses Pengelolaan", d: "Alur sampah dari rumah hingga pengolahan." },
  { icon: BookOpenCheck, t: "Panduan Pemilahan", d: "Cara memilah sampah, tersedia di Beranda." },
];

function Informasi() {
  return (
    <div className="space-y-5">
      <PageHeader icon={Info} title="Informasi" text="Pengumuman, proses, jadwal, dan lokasi pengelolaan sampah." />
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          { to: "/pengumuman", icon: Megaphone, t: "Pengumuman", d: "Informasi resmi dari pengurus." },
          { to: "/proses", icon: Workflow, t: "Proses Pengelolaan", d: "Alur sampah dari rumah hingga TPA." },
          { to: "/jadwal", icon: CalendarDays, t: "Jadwal Pengangkutan", d: "Hari dan jam pengangkutan." },
          { to: "/lokasi", icon: MapPin, t: "Lokasi Pengelolaan", d: "Peta wilayah dan TPA." },
        ] as const).map((f) => (
          <Link key={f.to} to={f.to} className="feature-tile flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-pale text-brand"><f.icon className="size-5" /></span>
            <div className="min-w-0 flex-1"><p className="font-semibold">{f.t}</p><p className="text-sm text-muted-foreground">{f.d}</p></div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
      <h2 className="pt-3 font-display text-xl font-semibold">Tentang Aplikasi</h2>
      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Smart Waste Management System adalah sistem informasi berbasis web yang membantu warga RW 10 Airmadidi Atas
          mendapatkan informasi pengelolaan sampah secara cepat, akurat, dan mudah diakses — kapan saja dari ponsel.
        </p>
      </section>
      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-semibold"><Target className="size-4 text-brand-mid" /> Tujuan</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Meningkatkan kesadaran warga dalam memilah dan membuang sampah.</li>
          <li>Memastikan warga mengetahui jadwal pengangkutan sampah.</li>
          <li>Mempermudah koordinasi antara pengurus, petugas, dan masyarakat.</li>
        </ul>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Fitur untuk Masyarakat</h2>
        <div className="space-y-2.5">
          {FITUR.map((f) => (
            <div key={f.t} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-pale text-brand-mid"><f.icon className="size-5" /></span>
              <div><p className="font-semibold">{f.t}</p><p className="text-sm text-muted-foreground">{f.d}</p></div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-semibold"><Users className="size-4 text-brand-mid" /> Pengelola</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Dikembangkan oleh Universitas Klabat bersama pengurus RW 10 Airmadidi Atas, Kabupaten Minahasa Utara.
        </p>
      </section>
    </div>
  );
}
