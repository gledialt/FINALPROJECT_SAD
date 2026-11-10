import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ShieldCheck, Truck, Users, Leaf, Recycle, Sprout } from "lucide-react";
import { Brand } from "./brand";
import community from "@/assets/community-clean.jpg";

const ROLES = [
  { role: "masyarakat" as const, cls: "role-card-community", icon: Users, title: "Masyarakat", caption: "Warga RW 10", text: "Informasi lingkungan, jadwal & panduan pemilahan sampah." },
  { role: "petugas" as const, cls: "role-card-officer", icon: Truck, title: "Petugas Kebersihan", caption: "Tim kebersihan", text: "Kelola jadwal pengangkutan, lokasi, dan pengumuman." },
  { role: "admin" as const, cls: "role-card-admin", icon: ShieldCheck, title: "Admin", caption: "Pengurus", text: "Administrasi sistem & pengelolaan pengguna." },
];

export function RoleSelection({ redirect }: { redirect?: string | undefined }) {
  return (
    <div className="role-selection min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Brand />
        <span className="hidden items-center gap-1.5 text-xs font-medium role-eyebrow sm:flex"><Sprout className="size-4" /> RW 10 · Airmadidi Atas</span>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-10">
        <div className="role-cover-green relative overflow-hidden">
          <img src={community} alt="Warga dan petugas memilah sampah bersama" width={1536} height={1024} className="role-photo absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-luminosity" />
          <div className="photo-shade absolute inset-0" />
          <div className="role-emblem absolute right-8 top-8 hidden role-accent sm:block" aria-hidden="true"><Recycle className="size-14" strokeWidth={1} /></div>
          <Leaf className="role-leaf absolute bottom-8 right-12 size-8 role-accent" aria-hidden="true" />
          <div className="role-intro relative max-w-xl px-6 py-10 text-on-brand md:px-10 md:py-14">
            <span className="role-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"><Leaf className="size-3.5" /> Bersama untuk lingkungan kita</span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-5xl">Smart Waste<br /><span className="role-accent">Management</span></h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-on-brand-muted">Lingkungan bersih, dimulai dari kita.<br />RW 10 Airmadidi Atas.</p>
          </div>
        </div>
        <div className="mb-5 mt-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest role-eyebrow">Selamat datang</p>
            <h2 className="mt-1 font-display text-3xl font-semibold role-heading">Pilih peran Anda</h2>
          </div>
          <span className="hidden text-sm text-muted-foreground sm:block">Satu lingkungan, satu tujuan.</span>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {ROLES.map((item) => (
            <Link key={item.role} to="/auth" search={{ role: item.role, mode: "login", redirect }} className={`${item.cls} role-card role-option group block hover:-translate-y-1`}>
              <div className="role-card-band" />
              <div className="relative p-6">
                <div className="role-card-glow" aria-hidden="true" />
                <div className="relative flex items-center justify-between">
                  <span className="role-card-icon role-icon flex size-12 items-center justify-center rounded-2xl"><item.icon className="size-6" /></span>
                  <ArrowUpRight className="role-arrow size-5 text-muted-foreground group-hover:text-foreground" />
                </div>
                <p className="relative mt-5 text-xs font-semibold uppercase tracking-wider role-eyebrow">{item.caption}</p>
                <h3 className="relative mt-1 text-lg font-semibold role-heading">{item.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">Smart Waste Management · RW 10 Airmadidi Atas</p>
      </main>
    </div>
  );
}
