import { describe, expect, it } from "vitest";
import { matchesQuery } from "./search-box";

describe("matchesQuery", () => {
  it("matches any field case-insensitively", () => {
    expect(matchesQuery("rw 10", "Jadwal", "Pengangkutan RW 10")).toBe(true);
  });
  it("rejects when no field contains the query", () => {
    expect(matchesQuery("organik", "Pengumuman kerja bakti", null)).toBe(false);
  });
  it("empty query matches everything", () => {
    expect(matchesQuery("  ", "apa saja")).toBe(true);
  });
});
