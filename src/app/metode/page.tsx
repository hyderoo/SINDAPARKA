import Link from "next/link";

export const metadata = { title: "Cara hitung dan batasannya - SINDAPARKA" };

export default function Metode() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-5 py-10 leading-relaxed">
      <Link href="/" className="text-sm font-bold text-leaf underline">Beranda</Link>
      <h1 className="font-display text-3xl font-semibold">Cara hitung dan batasannya</h1>
      <p>SINDAPARKA adalah alat bantu pencatatan dan skrining. Hasilnya bukan diagnosis. Keputusan klinis tetap di tangan tenaga kesehatan.</p>
      <h2 className="font-display text-xl font-semibold">Aturan yang dipakai</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Permenkes No. 2 Tahun 2020 tentang Standar Antropometri Anak: indeks BB/U, PB/U atau TB/U, BB/PB atau BB/TB, dan IMT/U untuk usia 0 sampai 60 bulan, kategori dan ambang batas sesuai lampiran. Usia dihitung dalam bulan penuh.</li>
        <li>Tabel L, M, S dari WHO Child Growth Standards 2006 (cdn.who.int).</li>
        <li>Panjang badan diukur berbaring sampai 24 bulan, tinggi badan berdiri di atas 24 bulan. Cara ukur yang berbeda dikoreksi 0,7 cm.</li>
      </ul>
      <h2 className="font-display text-xl font-semibold">Yang sudah diperiksa</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Uji otomatis untuk batas kategori, aturan 24 bulan, koreksi 0,7 cm, dan nilai median.</li>
        <li>Perbandingan 1500 anak acak dengan pustaka pygrowup (porting makro WHO igrowup): BB/TB cocok sampai 0,005 SD di semua usia; PB/U dan BB/U cocok di semua usia kecuali 1, 2, dan 24 bulan (selisih sampai 0,26 SD karena WHO memakai tabel mingguan untuk 13 minggu pertama, sedangkan Permenkes memakai tabel bulanan). Di sekitar batas kategori pada usia itu, hasil bisa berbeda tipis dari perangkat lunak WHO.</li>
      </ul>
      <h2 className="font-display text-xl font-semibold">Yang belum diperiksa</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Belum dibandingkan dengan keluaran e-PPGBM atau ditinjau tenaga kesehatan. Itu perlu dilakukan sebelum dipakai untuk keputusan.</li>
        <li>Anak di atas 60 bulan tidak dicakup.</li>
        <li>Ketepatan hasil bergantung pada ketepatan alat ukur dan cara mengukur.</li>
      </ul>
    </main>
  );
}
