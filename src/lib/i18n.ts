export type Lang = "id" | "en";
const D = {
  nav_dashboard: { id: "Ringkasan", en: "Overview" },
  nav_periksa: { id: "Periksa", en: "Measure" },
  nav_anak: { id: "Anak", en: "Children" },
  nav_jadwal: { id: "Jadwal", en: "Schedule" },
  nav_laporan: { id: "Laporan", en: "Reports" },
  nav_admin: { id: "Admin", en: "Admin" },
  demo: { id: "Alat bantu skrining, bukan diagnosis. Keputusan klinis oleh tenaga kesehatan.", en: "Screening aid, not a diagnosis. Clinical decisions stay with health workers." },
  offline: { id: "Tidak ada sinyal. Data belum bisa disimpan.", en: "No connection. Data cannot be saved yet." },
  pending: { id: "menunggu sinkron", en: "waiting to sync" },
  sync: { id: "Sinkronkan", en: "Sync" },
  logout: { id: "Keluar", en: "Sign out" },
  hello: { id: "Selamat datang", en: "Welcome" },
  children: { id: "Balita terpantau", en: "Children tracked" },
  stunting: { id: "Prevalensi pendek", en: "Stunting prevalence" },
  attention: { id: "Perlu perhatian", en: "Needs attention" },
  falling: { id: "Kurva turun", en: "Falling curve" },
  new_measure: { id: "Catat penimbangan", en: "Record a measurement" },
  save: { id: "Simpan", en: "Save" },
} as const;
export type Key = keyof typeof D;
export const t = (lang: Lang, k: Key) => D[k][lang];
