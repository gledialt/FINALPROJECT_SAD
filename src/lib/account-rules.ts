import { z } from "zod";

export const accountPasswordSchema = z.string().min(8, "Password minimal 8 karakter.").max(128, "Password maksimal 128 karakter.");

export const invitationSchema = z.object({
  email: z.string().trim().email("Email tidak valid.").transform((v) => v.toLowerCase()),
  full_name: z.string().trim().min(1, "Nama lengkap wajib diisi.").max(150),
  role: z.enum(["masyarakat", "petugas", "admin"]),
  whatsapp: z.string().trim().max(30).default(""),
  address: z.string().trim().max(500).default(""),
  rt_rw: z.string().trim().max(30).default(""),
  kelurahan: z.string().trim().max(150).default(""),
});

export function residentialData(data: z.infer<typeof invitationSchema>) {
  return data.role === "masyarakat"
    ? { address: data.address, rt_rw: data.rt_rw, kelurahan: data.kelurahan }
    : { address: null, rt_rw: null, kelurahan: null };
}

export function canInvite(role: string | null, active: boolean) {
  return role === "admin" && active;
}