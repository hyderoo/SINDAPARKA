import Link from "next/link";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Panduan latihan kader (cetak) - SINDAPARKA" };

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-base font-bold text-leaf-deep">{children}</h2>;
}

export default function Latihan() {
  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8 print-onepage">
      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href="/panduan" className="inline-flex min-h-11 items-center text-sm font-bold text-leaf">&larr; Panduan mengukur</Link>
        <span className="sm:ml-auto"><PrintButton /></span>
      </div>

      <div className="card space-y-3 p-5 text-[13px] leading-snug print-sheet">
        <header>
          <h1 className="font-display text-xl font-bold">Panduan latihan kader posyandu - satu halaman</h1>
          <p className="text-xs text-mute">
            Saduran dari Permenkes RI No. 2 Tahun 2020 (Standar Antropometri Anak), WHO Child Growth Standards 2006, dan Buku KIA (Kemenkes).
            Belum ditinjau petugas puskesmas setempat - minta pembina memeriksa sebelum dipakai melatih.
          </p>
        </header>

        <section className="space-y-1">
          <H>1. Kenapa menimbang dan mengukur setiap bulan</H>
          <p>Tinggi menurut umur yang terlalu rendah (stunting) berkembang perlahan dan sering tidak terlihat dari luar. Penimbangan dan pengukuran rutin tiap bulan di posyandu adalah cara utama menemukannya dini, saat perbaikan gizi masih paling berkesempatan berhasil (Buku KIA; Permenkes 2/2020).</p>
        </section>

        <section className="space-y-1">
          <H>2. Cara ukur yang benar (ringkas)</H>
          <ul className="list-disc space-y-0.5 pl-4">
            <li>Timbangan dinolkan (tara) sebelum setiap anak; anak berpakaian sesedikit mungkin.</li>
            <li>Di bawah 24 bulan: panjang badan, berbaring di infantometer, dua orang. 24 bulan ke atas: tinggi badan, berdiri di stadiometer.</li>
            <li>Cara ukur tidak sesuai usia? Koreksi 0,7 cm (berdiri untuk &lt;24 bulan: tambah; berbaring untuk &ge;24 bulan: kurang). Aplikasi mengoreksi otomatis.</li>
            <li>Catat satu angka di belakang koma (9,4 kg; 75,2 cm). Hasil janggal? Ulangi sebelum mencatat.</li>
            <li>Detail lengkap: halaman Panduan mengukur anak di aplikasi.</li>
          </ul>
        </section>

        <section className="space-y-1">
          <H>3. Membaca hasil</H>
          <ul className="list-disc space-y-0.5 pl-4">
            <li>Aplikasi menghitung z-score dari standar WHO 2006 sesuai Permenkes 2/2020: TB/U (pendek/stunting), BB/U, BB/TB, dan IMT/U.</li>
            <li>TB/U di bawah -2 SD = Pendek; di bawah -3 SD = Sangat pendek. Keduanya ditandai untuk dirujuk ke puskesmas.</li>
            <li>KMS: catat titik berat badan setiap bulan. Garis berat anak harus mengikuti pita. Tanda N (naik) baik; T (tidak naik) perlu perhatian - aplikasi menampilkan tanda ini di riwayat anak.</li>
            <li>Kurva tinggi yang turun 4 kunjungan berturut-turut ditandai "kurva turun" di aplikasi walau z-score belum pendek.</li>
          </ul>
        </section>

        <section className="space-y-1">
          <H>4. Memakai aplikasi saat posyandu</H>
          <ul className="list-disc space-y-0.5 pl-4">
            <li>Buka Periksa, pilih anak, isi tanggal, berat, tinggi/panjang, dan cara ukur. Simpan.</li>
            <li>Tidak ada sinyal? Catat tetap bisa; tersimpan di perangkat dan terkirim otomatis saat sinyal kembali (terlihat di kotak "menunggu dikirim").</li>
            <li>Perangkat dipakai bersama? Pilih akun Anda di halaman masuk, ketik kata sandi sendiri. Keluar setelah selesai.</li>
            <li>Anak yang perlu dirujuk: buka profil anak, ketuk Surat rujukan, cetak untuk dibawa orang tua ke puskesmas.</li>
          </ul>
        </section>

        <section className="space-y-1">
          <H>5. Rancangan sesi peragaan 20 menit di posyandu</H>
          <ol className="list-decimal space-y-0.5 pl-4">
            <li><b>0-3 mnt:</b> kenapa timbang-ukur tiap bulan (bagian 1), dengan contoh KMS.</li>
            <li><b>3-8 mnt:</b> peragaan menimbang dan mengukur oleh dua kader, satu sukarelawan anak atau boneka; peserta menyebutkan kesalahan yang sengaja diperagakan.</li>
            <li><b>8-13 mnt:</b> latihan mencatat di aplikasi memakai data uji coba (anak fiktif "Anak Uji"), bukan data anak sungguhan. Data uji coba bisa dihapus admin dengan satu tombol.</li>
            <li><b>13-17 mnt:</b> membaca hasil bersama: status, tanda N/T, kurva turun, kapan rujuk (bagian 3).</li>
            <li><b>17-20 mnt:</b> tanya jawab dan bagi tugas pengukur, penimbang, dan pencatat untuk jadwal berikutnya.</li>
          </ol>
        </section>

        <footer className="border-t border-line pt-2 text-[11px] text-mute">
          Sumber: Permenkes RI No. 2/2020; WHO Child Growth Standards 2006 (who.int); Buku KIA, Kemenkes RI; ayosehat.kemkes.go.id.
          Ringkasan untuk latihan, bukan pengganti dokumen resmi atau pelatihan puskesmas.
        </footer>
      </div>
    </div>
  );
}
