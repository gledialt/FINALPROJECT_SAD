import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight, Clock, MapPin, Megaphone, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { dayName, fmtDate, fmtTime, scheduleDateLabel, scheduleRelativeLabel } from "@/lib/schedule";

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-8 text-center">
      <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-brand-pale text-brand-mid">
        <Icon className="size-5" />
      </span>
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionHead({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-mid">{eyebrow}</p>}
        <h2 className="font-display text-xl font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function SeeAll({ to }: { to: "/pengumuman" | "/jadwal" | "/lokasi" | "/proses" }) {
  return (
    <Link to={to} className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand-mid hover:text-brand">
      Lihat Semua <ChevronRight className="size-4" />
    </Link>
  );
}

type Tone = "brand" | "success" | "warning" | "danger" | "neutral" | "info";
const toneCls: Record<Tone, string> = {
  brand: "bg-brand-pale text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-muted text-muted-foreground",
};
export function StatusBadge({ tone = "brand", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", toneCls[tone])}>
      {children}
    </span>
  );
}

export type Schedule = { id: string; day_of_week: number; start_time: string; end_time: string | null; notes: string | null; schedule_date?: string | null };
export type Announcement = { id: string; title: string; summary: string; published_at: string | null; created_at: string };

export function ScheduleRow({ s, now, highlight }: { s: Schedule; now: Date; highlight?: boolean }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3.5 shadow-card", highlight && "border-brand-soft")}>
      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-brand-pale py-2 text-brand">
        <CalendarDays className="size-4" />
        <span className="mt-1 text-xs font-bold">{dayName(s.day_of_week).slice(0, 3)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{scheduleDateLabel(s, now)}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Clock className="size-3.5" /> {fmtTime(s.start_time)}
          {s.end_time ? `–${fmtTime(s.end_time)}` : ""}
          {!s.schedule_date && " · Setiap minggu"}
        </p>
        {s.notes && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.notes}</p>}
      </div>
      <StatusBadge tone={highlight ? "brand" : "neutral"}>{scheduleRelativeLabel(s, now)}</StatusBadge>
    </div>
  );
}

export function AnnouncementItem({ a }: { a: Announcement }) {
  return (
    <Link
      to="/pengumuman/$id"
      params={{ id: a.id }}
      className="group flex gap-3 rounded-2xl border bg-card p-4 shadow-card transition hover:border-brand-soft"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-pale text-brand-mid">
        <Megaphone className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{fmtDate(a.published_at ?? a.created_at)}</p>
        <p className="mt-0.5 font-semibold leading-snug group-hover:text-brand">{a.title}</p>
        {a.summary && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.summary}</p>}
      </div>
      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function PageHeader({ title, text, icon: Icon = MapPin }: { title: string; text?: string; icon?: LucideIcon }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-on-brand">
        <Icon className="size-5" />
      </span>
      <div>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {text && <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
}
