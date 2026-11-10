export const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;

/** day_of_week: 1 = Senin … 7 = Minggu */
export function dayName(d: number) {
  return DAYS[d - 1] ?? "-";
}

export function fmtTime(t?: string | null) {
  return t ? t.slice(0, 5) : "";
}

/** ISO weekday (1=Mon..7=Sun) for a JS Date. */
export function isoDay(date: Date) {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

/**
 * Minutes until the next weekly occurrence of (day_of_week, start_time),
 * measured from `now`. Weekly schedules always have a determinable next date.
 */
export function minutesUntil(day: number, start: string, now: Date) {
  const [h = 0, m = 0] = start.split(":").map(Number);
  const nowMin = (isoDay(now) - 1) * 1440 + now.getHours() * 60 + now.getMinutes();
  const targetMin = (day - 1) * 1440 + h * 60 + m;
  let diff = targetMin - nowMin;
  if (diff < 0) diff += 7 * 1440;
  return diff;
}

export type ScheduleTiming = { day_of_week: number; start_time: string; schedule_date?: string | null };

export function occurrenceDate(row: ScheduleTiming, now: Date) {
  if (row.schedule_date) return new Date(`${row.schedule_date}T${row.start_time.slice(0, 5)}:00`);
  const result = new Date(now);
  result.setSeconds(0, 0);
  result.setMinutes(result.getMinutes() + minutesUntil(row.day_of_week, row.start_time, now));
  return result;
}

export function scheduleDateLabel(row: ScheduleTiming, now: Date) {
  return occurrenceDate(row, now).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function scheduleRelativeLabel(row: ScheduleTiming, now: Date) {
  if (!row.schedule_date) return relativeLabel(row.day_of_week, row.start_time, now);
  const date = occurrenceDate(row, now);
  if (date < now) return "Selesai";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  return days === 0 ? "Hari ini" : days === 1 ? "Besok" : `${days} hari lagi`;
}

export function sortByNext<T extends ScheduleTiming>(
  rows: T[],
  now: Date,
) {
  return [...rows].sort(
    (a, b) =>
      occurrenceDate(a, now).getTime() - occurrenceDate(b, now).getTime(),
  );
}

export function relativeLabel(day: number, start: string, now: Date) {
  const diff = minutesUntil(day, start, now);
  const days = Math.floor((diff + now.getHours() * 60 + now.getMinutes()) / 1440);
  if (days === 0) return "Hari ini";
  if (days === 1) return "Besok";
  return `${days} hari lagi`;
}

export function fmtDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
