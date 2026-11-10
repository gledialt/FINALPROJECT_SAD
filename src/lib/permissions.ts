import type { AppRole } from "./session";

export function canManageOperations(role: AppRole | null | undefined, feature: "announcements" | "schedules" | "locations" | "processes" | "guides" = "locations") {
  return role === "admin" || (role === "petugas" && feature !== "processes" && feature !== "guides");
}

export function visibleSections(role: AppRole) {
  if (role === "petugas") return ["beranda", "pengumuman", "jadwal", "lokasi", "akun"];
  if (role === "admin") return ["beranda", "pengumuman", "proses", "jadwal", "lokasi", "pengguna", "panduan", "akun"];
  return ["beranda", "pengumuman", "proses", "jadwal", "lokasi", "informasi", "akun"];
}

export function canManageUsers(role: AppRole | null | undefined) {
  return role === "admin";
}

export function canRegister(role: AppRole | null | undefined) {
  return role === "masyarakat";
}

/** Tabs in the bottom navigation bar. */
export function bottomNavSections(role: AppRole) {
  return role === "masyarakat" ? ["beranda", "informasi", "akun"] : ["beranda", "akun"];
}
