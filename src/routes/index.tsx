import { createFileRoute } from "@tanstack/react-router";
import { RoleSelection } from "@/components/role-selection";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Pilih Peran — Smart Waste Management RW 10" },
    { name: "description", content: "Pilih akun masyarakat, petugas kebersihan, atau admin RW 10 Airmadidi Atas." },
    { property: "og:title", content: "Pilih Peran — Smart Waste Management RW 10" },
    { property: "og:description", content: "Pengelolaan sampah bersama warga dan petugas RW 10 Airmadidi Atas." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: RoleSelection,
});
