import { z } from "zod";
import type { AppRole } from "./session";

export const JENIS = { keluhan: "Keluhan", saran: "Saran", apresiasi: "Apresiasi" } as const;
export const KATEGORI = {
  pengangkutan: "Pengangkutan Sampah",
  jadwal: "Jadwal Pengangkutan",
  pelayanan: "Pelayanan Petugas Kebersihan",
  kebersihan: "Kebersihan Lingkungan",
  lainnya: "Lainnya",
} as const;
export const STATUS = { baru: "Baru", diproses: "Diproses", dibalas: "Dibalas", selesai: "Selesai" } as const;
export type FeedbackStatus = keyof typeof STATUS;
export const STATUS_TONE: Record<FeedbackStatus, "info" | "warning" | "brand" | "success"> = {
  baru: "info",
  diproses: "warning",
  dibalas: "brand",
  selesai: "success",
};

export const feedbackSchema = z.object({
  jenis_feedback: z.enum(["keluhan", "saran", "apresiasi"], { message: "Pilih jenis feedback" }),
  kategori: z.enum(["pengangkutan", "jadwal", "pelayanan", "kebersihan", "lainnya"], { message: "Pilih kategori" }),
  judul: z.string().trim().min(1, "Judul wajib diisi").max(150, "Judul maksimal 150 karakter"),
  isi_pesan: z.string().trim().min(1, "Isi feedback wajib diisi").max(3000, "Isi maksimal 3000 karakter"),
});

/** Only residents send feedback; only admins reply or change status; admins and officers can add internal notes. */
export const canSendFeedback = (r: AppRole) => r === "masyarakat";
export const canReplyFeedback = (r: AppRole) => r === "admin";
export const canViewAllFeedback = (r: AppRole) => r === "admin" || r === "petugas";
export const canAddInternalNote = (r: AppRole) => r === "admin" || r === "petugas";

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export async function resizePhoto(file: File, max = 1024): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}
