import { describe, expect, it } from "vitest";
import { bottomNavSections, canManageOperations, canManageUsers, canRegister, visibleSections } from "./permissions";

describe("Role access", () => {
  it("allows petugas announcement, schedule and location management only", () => {
    expect(canManageOperations("petugas")).toBe(true);
    expect(canManageOperations("admin")).toBe(true);
    expect(canManageOperations("masyarakat")).toBe(false);
    expect(canManageOperations("petugas", "announcements")).toBe(true);
    expect(canManageOperations("petugas", "schedules")).toBe(true);
    expect(canManageOperations("petugas", "processes")).toBe(false);
    expect(canManageOperations("petugas", "guides")).toBe(false);
    expect(canManageOperations("admin", "guides")).toBe(true);
  });
  it("limits officers to the five requested sections", () => {
    expect(visibleSections("petugas")).toEqual(["beranda", "pengumuman", "jadwal", "lokasi", "akun"]);
  });
  it("omits information for admin while retaining editable guides", () => {
    expect(visibleSections("admin")).not.toContain("informasi");
    expect(visibleSections("admin")).toContain("panduan");
  });
  it("reserves user management for admin", () => {
    expect(canManageUsers("admin")).toBe(true);
    expect(canManageUsers("petugas")).toBe(false);
    expect(canManageUsers("masyarakat")).toBe(false);
  });
  it("offers registration only for masyarakat", () => {
    expect(canRegister("masyarakat")).toBe(true);
    expect(canRegister("admin")).toBe(false);
    expect(canRegister("petugas")).toBe(false);
  });
  it("shows Beranda, Informasi, Akun at the bottom for masyarakat", () => {
    expect(bottomNavSections("masyarakat")).toEqual(["beranda", "informasi", "akun"]);
  });
  it("shows only Beranda and Akun at the bottom for admin and petugas", () => {
    expect(bottomNavSections("admin")).toEqual(["beranda", "akun"]);
    expect(bottomNavSections("petugas")).toEqual(["beranda", "akun"]);
  });
  it("has no separate sorting-guide feature for masyarakat", () => {
    expect(visibleSections("masyarakat")).not.toContain("panduan");
  });
});
