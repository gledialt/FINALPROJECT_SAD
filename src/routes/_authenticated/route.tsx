import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { MessageSquareHeart, ArrowLeft, BookOpenCheck, Bell, CalendarDays, Home, LayoutGrid, Leaf, LogOut, MapPin, Megaphone, Recycle, User, Users, Workflow, type LucideIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/brand";
import { ROLE_LABEL, ROLE_THEME, useMe } from "@/lib/session";
import { cn } from "@/lib/utils";
import { bottomNavSections } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // "Ingat saya" unchecked: end the session once the browser was closed.
    if (localStorage.getItem("sw-remember") === "0" && !sessionStorage.getItem("sw-active")) {
      await supabase.auth.signOut();
      localStorage.removeItem("sw-remember");
    }
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.href } });
  },
  component: AuthedLayout,
});

type NavItem = { to: "/beranda" | "/informasi" | "/akun"; label: string; icon: LucideIcon };

const RESIDENT_NAV: NavItem[] = [
  { to: "/beranda", label: "Beranda", icon: Home },
  { to: "/informasi", label: "Informasi", icon: LayoutGrid },
  { to: "/akun", label: "Akun", icon: User },
];
const STAFF_NAV: NavItem[] = [
  { to: "/beranda", label: "Beranda", icon: Home },
  { to: "/akun", label: "Akun", icon: User },
];

type SideItem = { to: "/beranda" | "/informasi" | "/akun" | "/pengumuman" | "/proses" | "/jadwal" | "/lokasi" | "/admin/pengumuman" | "/admin/proses" | "/admin/jadwal" | "/admin/lokasi" | "/admin/pengguna" | "/panduan" | "/feedback" | "/admin/feedback"; label: string; icon: LucideIcon };
const ADMIN_SIDE: SideItem[] = [
  { to: "/beranda", label: "Beranda", icon: Home },
  { to: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
  { to: "/admin/proses", label: "Proses Pengelolaan", icon: Workflow },
  { to: "/admin/jadwal", label: "Jadwal Pengangkutan", icon: CalendarDays },
  { to: "/admin/lokasi", label: "Lokasi Pengelolaan", icon: MapPin },
  { to: "/admin/pengguna", label: "Kelola Pengguna", icon: Users },
  { to: "/admin/feedback", label: "Kelola Feedback", icon: MessageSquareHeart },
  { to: "/panduan", label: "Panduan Pemilahan", icon: BookOpenCheck },
  { to: "/akun", label: "Akun", icon: User },
];
const OFFICER_SIDE = ADMIN_SIDE.filter((i) => !["/admin/proses", "/admin/pengguna", "/panduan"].includes(i.to)).map((i) => (i.to === "/admin/feedback" ? { ...i, label: "Feedback Masyarakat" } : i));
const RESIDENT_SIDE: SideItem[] = [
  { to: "/beranda", label: "Beranda", icon: Home },
  { to: "/informasi", label: "Informasi", icon: LayoutGrid },
  { to: "/pengumuman", label: "Pengumuman", icon: Megaphone },
  { to: "/proses", label: "Proses Pengelolaan", icon: Workflow },
  { to: "/jadwal", label: "Jadwal Pengangkutan", icon: CalendarDays },
  { to: "/lokasi", label: "Lokasi Pengelolaan", icon: MapPin },
  { to: "/panduan", label: "Panduan Pemilahan", icon: BookOpenCheck },
  { to: "/feedback", label: "Feedback", icon: MessageSquareHeart },
  { to: "/akun", label: "Akun", icon: User },
];
const TAB_PATHS = ["/beranda", "/informasi", "/akun"];

function activeTab(path: string, role: string): NavItem["to"] {
  if (path.startsWith("/akun")) return "/akun";
  if (role === "masyarakat" && ["/informasi", "/pengumuman", "/proses", "/jadwal", "/lokasi"].some((p) => path.startsWith(p))) return "/informasi";
  return "/beranda";
}

function AuthedLayout() {
  const { data: me, isLoading } = useMe();
  const { pathname } = useLocation();

  if (isLoading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Recycle className="size-8 animate-spin text-brand-mid" />
      </div>
    );
  }

  if (me.profile && !me.profile.is_active) return <InactiveNotice />;

  const theme = ROLE_THEME[me.role];
  const allowedTabs = bottomNavSections(me.role);
  const nav = [...RESIDENT_NAV, ...STAFF_NAV].filter((n, i, all) => all.findIndex((x) => x.to === n.to) === i && allowedTabs.includes(n.to.slice(1)));
  const current = activeTab(pathname, me.role);
  const side = me.role === "admin" ? ADMIN_SIDE : me.role === "petugas" ? OFFICER_SIDE : RESIDENT_SIDE;
  const showBack = !TAB_PATHS.some((p) => pathname === p || pathname === p + "/");

  return (
    <div className={cn(theme, "flex min-h-screen flex-col bg-background text-foreground")}>
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className={cn("mx-auto flex w-full items-center justify-between px-4 py-3 lg:px-8", side ? "max-w-none" : "max-w-5xl")}>
          <Brand compact />
          <Link to="/akun" className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold">{me.profile?.full_name || me.email}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABEL[me.role]}</p>
            </div>
            <Avatar name={me.profile?.full_name} src={me.profile?.avatar_url} />
          </Link>
        </div>
      </header>
      <div className="flex flex-1">
        {side && (
          <aside className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground lg:flex" aria-label="Menu samping">
            {side.map((i) => (
              <Link key={i.to} to={i.to} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground" activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-card" }}>
                <i.icon className="size-4" /> {i.label}
              </Link>
            ))}
            <div className="mt-auto border-t border-sidebar-border pt-3"><SignOutButton className="w-full text-danger-bright hover:bg-danger-bright-soft" /></div>
          </aside>
        )}
        <main className={cn("mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 lg:px-8 lg:pt-8", side && "lg:pb-10")}>
          {showBack && (
            <Link to="/beranda" className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-card transition hover:text-foreground">
              <ArrowLeft className="size-4" /> Kembali ke Beranda
            </Link>
          )}
          <div key={pathname} className="page-enter"><Outlet /></div>
        </main>
      </div>
      <nav className={cn("bottom-nav fixed inset-x-0 bottom-0 z-30 border-t", side && "lg:hidden")} aria-label="Navigasi utama">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              data-active={current === n.to}
              className="bottom-nav-item flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium text-muted-foreground transition"
            >
              <span className="bottom-nav-pill flex h-8 w-14 items-center justify-center rounded-full transition"><n.icon className="size-5" /></span>
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Avatar({ name, onDark, src, className }: { name?: string | null | undefined; onDark?: boolean | undefined; src?: string | null | undefined; className?: string | undefined }) {
  const initials =
    (name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";
  if (src) return <img src={src} alt={name ?? "Foto profil"} className={cn("size-9 rounded-full object-cover", className)} />;
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-full text-sm font-bold",
        className,
        onDark ? "bg-brand-mid text-on-brand ring-2 ring-brand-soft/40" : "bg-primary text-primary-foreground",
      )}
    >
      {initials}
    </span>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className={cn("flex items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium", className)}>
          <LogOut className="size-4" /> Keluar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Yakin ingin keluar?</AlertDialogTitle>
          <AlertDialogDescription>Anda perlu masuk kembali untuk mengakses akun Anda.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              await qc.cancelQueries();
              qc.clear();
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
          >
            Ya, keluar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function InactiveNotice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <Bell className="size-8 text-warning" />
      <h1 className="font-display text-2xl font-semibold">Akun tidak aktif</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Akun Anda sedang dinonaktifkan oleh Admin. Hubungi pengurus RW untuk mengaktifkan kembali.
      </p>
      <SignOutButton className="border hover:bg-muted" />
      <Leaf className="hidden" />
    </div>
  );
}
