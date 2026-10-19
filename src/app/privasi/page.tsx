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
      <p>Data disimpan di Supabase (database PostgreSQL) di wilayah Sydney, Australia, dengan koneksi terenkripsi. Penghapusan penimbangan bersifat soft delete dan tercatat. Perubahan data anak dan penimbangan dicatat di log audit. Kebijakan masa simpan dan permintaan penghapusan dari orang tua harus ditetapkan oleh pengendali data.</p>
      <h2 className="font-display text-xl font-semibold">Siapa yang bertanggung jawab atas data</h2>
      <p>SINDAPARKA disiapkan untuk program KKN di wilayah Parakan Kauman, Parakan, Temanggung. Pihak yang menentukan tujuan dan cara penggunaan data (pengendali data) kemungkinan besar puskesmas setempat (keputusan ada pada kepala puskesmas) atau Dinas Kesehatan kabupaten. BKKBN terlibat dalam program ini, tetapi perannya terhadap data belum ditetapkan. Penetapan itu harus datang dari pihak-pihak tersebut, bukan dari pengembang. Pengembang aplikasi berperan menyiapkan dan menjalankan sistem atas nama pengendali (pemroses data) dan perlu perjanjian tertulis dengan pengendali sebelum data sungguhan dimasukkan.</p>
      <h2 className="font-display text-xl font-semibold">Yang harus diputuskan puskesmas sebelum data anak sungguhan dimasukkan</h2>
      <ol className="list-decimal space-y-1 pl-5">
        <li>Siapa pengendali data (puskesmas, Dinkes, atau bersama BKKBN) dan siapa penanggung jawab serta kontak pelindungan data yang bisa dihubungi orang tua.</li>
        <li>Persetujuan tertulis: formulir persetujuan orang tua atau wali yang resmi, siapa yang menyimpannya, dan bagaimana orang tua menarik persetujuan.</li>
        <li>Perjanjian tertulis antara puskesmas dan pengembang tentang peran pemroses data, batas penggunaan, dan kewajiban saat terjadi kebocoran.</li>
        <li>Persetujuan lokasi penyimpanan: data disimpan di Supabase wilayah Sydney, Australia (di luar Indonesia). Pengendali harus menyetujui ini atau meminta alternatif.</li>
        <li>Masa simpan data dan cara penghapusan atau permintaan koreksi dari orang tua.</li>
        <li>Siapa admin yang menyetujui akun kader dan tenaga kesehatan, siapa yang berhak melihat data tiap posyandu, dan kapan akun yang tidak lagi bertugas dinonaktifkan.</li>
        <li>Apakah BKKBN menerima data atau laporan dari aplikasi ini, dalam bentuk apa (misalnya hanya agregat tanpa nama), dan atas dasar apa.</li>
        <li>Hubungan dengan sistem resmi Kemenkes (e-PPGBM, ASIK): apakah SINDAPARKA boleh dipakai berdampingan, dan apakah data perlu diekspor ke sana.</li>
        <li>Tinjauan hukum atas dasar pemrosesan menurut UU 27/2022 (Pelindungan Data Pribadi), karena data kesehatan anak termasuk data pribadi yang bersifat spesifik.</li>
      </ol>
      <p className="text-sm text-mute">Sampai butir di atas ditetapkan, jangan memasukkan data anak yang sebenarnya. Data yang ada sekarang fiktif untuk uji coba.</p>
    </main>
  );
}
