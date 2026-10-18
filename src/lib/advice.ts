import type { Assessment } from "./who";

export interface Advice {
  tone: "ok" | "watch" | "act";
  headline: string;
  bullets: string[];
  referral: boolean;
}

/**
 * Plain-language guidance for cadres. General nutrition and referral advice only:
 * this app supports screening, it does not replace a health worker's examination.
 */
export function adviceFor(a: Assessment, ageMonths: number, trend?: "falling" | "stable" | "rising"): Advice {
  const bullets: string[] = [];
  let tone: Advice["tone"] = "ok";
  let headline = "Pertumbuhan sesuai standar. Lanjutkan kebiasaan baik.";
  let referral = false;

  if (a.severelyStunted || a.sWfh?.level === "severe" || a.sWfa?.level === "severe") {
    tone = "act";
    referral = true;
    headline = "Perlu segera diperiksa tenaga kesehatan.";
    bullets.push("Rujuk ke puskesmas atau dokter anak minggu ini untuk pemeriksaan dan pemeriksaan penyebab.");
  } else if (a.stunted || a.sWfh?.level === "moderate" || a.sWfa?.level === "moderate") {
    tone = "act";
    referral = a.stunted;
    headline = a.stunted ? "Anak terdeteksi pendek (berisiko stunting)." : "Berat badan perlu perhatian.";
    bullets.push("Sarankan orang tua konsultasi ke bidan atau puskesmas untuk pemeriksaan lebih lanjut.");
  } else if (a.sWfh?.level === "watch" || a.sWfh?.level === "high" || a.sWfa?.level === "watch") {
    tone = "watch";
    headline = "Berat badan di atas rentang ideal.";
    bullets.push("Atur porsi dan kurangi makanan atau minuman manis. Ajak anak aktif bergerak.");
  } else if (trend === "falling") {
    tone = "watch";
    headline = "Masih normal, tetapi kurva mulai turun.";
    bullets.push("Pantau lagi bulan depan dan cek apakah anak sering sakit atau nafsu makannya turun.");
  }

  if (a.stunted || a.sWfh?.level === "moderate" || a.sWfh?.level === "severe" || a.sWfa?.level === "moderate" || a.sWfa?.level === "severe") {
    if (ageMonths < 6) {
      bullets.push("Pastikan ASI eksklusif, menyusu sesering anak mau, dan cek perlekatan menyusu.");
    } else if (ageMonths < 24) {
      bullets.push("Berikan MPASI 3 kali makan utama dan 1 sampai 2 kali selingan, tekstur sesuai usia, lanjutkan ASI.");
      bullets.push("Tambahkan protein hewani setiap hari: telur, ikan, ayam, atau hati ayam.");
    } else {
      bullets.push("Makan 3 kali sehari dan 2 kali selingan bergizi. Tambahkan protein hewani seperti telur, ikan, atau ayam setiap hari.");
    }
    bullets.push("Timbang dan ukur lagi di posyandu bulan depan, jangan lewatkan jadwal.");
  }

  if (tone === "ok") {
    bullets.push(
      ageMonths < 6
        ? "ASI eksklusif sampai 6 bulan. Datang ke posyandu setiap bulan."
        : "Pertahankan makan beragam dengan protein hewani dan sayur. Datang ke posyandu setiap bulan.",
    );
  }
  bullets.push("Cek buku KIA: imunisasi dan vitamin A sesuai jadwal.");
  return { tone, headline, bullets, referral };
}
