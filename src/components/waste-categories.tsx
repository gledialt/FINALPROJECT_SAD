import { Apple, Package, Trash2, FlaskConical } from "lucide-react";

export const CATEGORIES = [
  {
    key: "organik",
    name: "Organik",
    icon: Apple,
    color: "bg-organic",
    short: "Sisa makanan, daun, sayur",
    detail: "Sampah yang mudah terurai: sisa makanan, kulit buah, sayuran, daun, dan ranting. Dapat dijadikan kompos.",
  },
  {
    key: "anorganik",
    name: "Anorganik",
    icon: Package,
    color: "bg-inorganic",
    short: "Plastik, kaleng, kertas",
    detail: "Sampah yang sulit terurai namun dapat didaur ulang: botol plastik, kaleng, kertas, kardus, dan kaca. Bersihkan dan keringkan sebelum dibuang.",
  },
  {
    key: "residu",
    name: "Residu",
    icon: Trash2,
    color: "bg-residue",
    short: "Popok, puntung, styrofoam",
    detail: "Sampah yang tidak dapat didaur ulang maupun dikomposkan: popok sekali pakai, pembalut, puntung rokok, styrofoam kotor.",
  },
  {
    key: "b3",
    name: "B3",
    icon: FlaskConical,
    color: "bg-hazard",
    short: "Baterai, lampu, obat",
    detail: "Bahan Berbahaya dan Beracun: baterai, lampu neon, obat kedaluwarsa, kemasan pestisida, dan cairan kimia. Pisahkan dan jangan dicampur.",
  },
] as const;
