import { describe, expect, it } from "vitest";
import { minutesUntil, sortByNext, occurrenceDate, scheduleRelativeLabel } from "./schedule";

// Saturday 17 Oct 2026, 13:00 local
const now = new Date(2026, 9, 17, 13, 0);

describe("schedule ordering", () => {
  it("uses the selected calendar date rather than weekly recurrence", () => {
    const row = { day_of_week: 1, start_time: "07:00", schedule_date: "2026-10-22" };
    expect(occurrenceDate(row, now)).toEqual(new Date(2026, 9, 22, 7, 0));
  });
  it("shows the next date for an undated weekly schedule", () => {
    expect(occurrenceDate({ day_of_week: 7, start_time: "07:00" }, now)).toEqual(new Date(2026, 9, 18, 7, 0));
  });
  it("does not repeat an elapsed calendar date next week", () => {
    expect(scheduleRelativeLabel({ day_of_week: 6, start_time: "07:00", schedule_date: "2026-10-17" }, now)).toBe("Selesai");
  });
  it("a later slot today comes before tomorrow", () => {
    expect(minutesUntil(6, "15:00", now)).toBe(120);
  });
  it("a slot that already passed today wraps to next week", () => {
    expect(minutesUntil(6, "08:00", now)).toBe(7 * 1440 - 300);
  });
  it("sorts nearest first", () => {
    const rows = [
      { day_of_week: 1, start_time: "07:00" },
      { day_of_week: 7, start_time: "07:00" },
    ];
    expect(sortByNext(rows, now)[0]?.day_of_week).toBe(7);
  });
});
