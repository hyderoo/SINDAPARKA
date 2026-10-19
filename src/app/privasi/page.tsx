import Link from "next/link";

export const metadata = { title: "Privasi - SINDAPARKA" };

export default function Privasi() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-5 py-10 leading-relaxed">
      <Link href="/" className="text-sm font-bold text-leaf underline">Beranda</Link>
      <h1 className="font-display text-3xl font-semibold">Privasi dan data anak</h1>
      <p className="rounded-xl bg-sun-soft p-3 text-sm font-semibold text-[#7A5B00]">Ini rancangan pemberitahuan privasi dari tim pengembang. Belum ditinjau oleh pihak hukum, puskesmas, atau BKKBN. Sebelum dipakai untuk data anak sungguhan, pengendali data harus menetapkan dan menyetujui isinya.</p>
      <h2 className="font-display text-xl font-semibold">Data yang dicatat</h2>
      <p>Nama anak, jenis kelamin, tanggal lahir, nama orang tua atau wali (opsional), posyandu, berat badan, panjang atau tinggi badan, tanggal ukur, dan tanggal persetujuan orang tua. Untuk pengguna: nama, email, peran, dan posyandu.</p>
      <h2 className="font-display text-xl font-semibold">Siapa yang bisa melihat</h2>
      <p>Kader hanya melihat anak di posyandunya. Tenaga kesehatan melihat posyandu di puskesmasnya. Admin melihat semua dan menyetujui akun. Aturan ini dijalankan oleh database (Row Level Security), bukan hanya oleh tampilan aplikasi. Pendaftar baru tidak bisa melihat data apa pun sampai disetujui admin.</p>
      <h2 className="font-display text-xl font-semibold">Persetujuan</h2>
      <p>Anak baru hanya bisa didaftarkan setelah kader menyatakan orang tua atau wali sudah diberi tahu dan setuju. Tanggal pernyataan itu disimpan. Persetujuan tertulis tetap perlu disimpan oleh posyandu sesuai ketentuan pengendali data.</p>
      <h2 className="font-display text-xl font-semibold">Penyimpanan dan penghapusan</h2>
      <p>Data disimpan di Supabase (database PostgreSQL) di wilayah Sydney, Australia. Penghapusan penimbangan bersifat soft delete dan tercatat. Perubahan data anak dan penimbangan dicatat di log audit. Kebijakan masa simpan dan permintaan penghapusan dari orang tua harus ditetapkan oleh pengendali data.</p>
      <h2 className="font-display text-xl font-semibold">Yang belum diputuskan</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Siapa pengendali data (BKKBN, puskesmas, atau posyandu) dan siapa kontak pelindungan data.</li>
        <li>Dasar hukum dan formulir persetujuan resmi menurut UU 27/2022 (Pelindungan Data Pribadi), karena data kesehatan anak termasuk data pribadi yang bersifat spesifik.</li>
        <li>Persetujuan transfer data ke luar Indonesia (server di Sydney), masa simpan, dan prosedur jika terjadi kebocoran.</li>
        <li>Hubungan dengan sistem resmi Kemenkes (e-PPGBM, ASIK).</li>
      </ul>
    </main>
  );
}
