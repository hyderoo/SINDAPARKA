import Link from "next/link";

export const metadata = { title: "Panduan mengukur anak - SINDAPARKA" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-2 p-5">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function Panduan() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <Link href="/periksa" className="inline-flex min-h-11 items-center text-sm font-bold text-leaf">&larr; Kembali</Link>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="font-display text-3xl font-semibold">Cara menimbang dan mengukur anak dengan benar</h1>
        <Link href="/panduan/latihan" className="btn btn-ghost !min-h-10 px-3 text-sm">Panduan latihan kader (cetak 1 halaman)</Link>
      </div>
      <p className="text-sm text-mute">
        Ringkasan praktis untuk kader posyandu, disarikan dari Standar Antropometri Anak (Permenkes RI No. 2 Tahun 2020),
        Buku KIA (Kemenkes), dan panduan pengukuran WHO untuk Standar Pertumbuhan Anak WHO 2006. Ini ringkasan, bukan pengganti
        dokumen resmi atau pelatihan dari puskesmas; bila ragu, ikuti arahan petugas kesehatan.
      </p>

      <Section title="Sebelum mulai">
        <ul className="list-disc space-y-1 pl-5 text-[15px]">
          <li>Gunakan timbangan yang dikalibrasi. Nol-kan (tara) sebelum setiap penimbangan.</li>
          <li>Ukur pada waktu yang konsisten bila bisa, misalnya sebelum makan besar.</li>
          <li>Catat hasil segera dengan satu angka di belakang koma (misalnya 9,4 kg dan 75,2 cm).</li>
          <li>Bila hasil terasa janggal (beda jauh dari bulan lalu), ulangi pengukuran sebelum mencatat.</li>
        </ul>
      </Section>

      <Section title="Menimbang berat badan">
        <ul className="list-disc space-y-1 pl-5 text-[15px]">
          <li>Bayi dan balita ditimbang dengan pakaian sesedikit mungkin, tanpa popok tebal, kaus kaki, atau topi.</li>
          <li>Timbangan dacin: gantungkan celana timbang, masukkan anak, baca setelah jarum berhenti.</li>
          <li>Timbangan digital: anak duduk atau berdiri diam di tengah papan, baca setelah angka stabil.</li>
          <li>Anak yang tidak bisa diam dapat ditimbang bersama ibunya: timbang ibu, tara, lalu timbang ibu sambil menggendong anak.</li>
          <li>Ketelitian: 0,1 kg untuk dacin, 0,01 kg untuk timbangan digital bayi.</li>
        </ul>
      </Section>

      <Section title="Mengukur panjang badan (di bawah 24 bulan, berbaring)">
        <ul className="list-disc space-y-1 pl-5 text-[15px]">
          <li>Gunakan papan pengukur panjang (infantometer). Pengukuran dilakukan dua orang.</li>
          <li>Anak berbaring terlentang tanpa alas tebal, kepala menempel pada papan kepala, garis mata tegak lurus ke atas.</li>
          <li>Satu orang memegang kepala, satu orang meluruskan lutut dan menekan telapak kaki tegak lurus ke papan kaki.</li>
          <li>Baca hasil dengan ketelitian 0,1 cm.</li>
        </ul>
      </Section>

      <Section title="Mengukur tinggi badan (24 bulan ke atas, berdiri)">
        <ul className="list-disc space-y-1 pl-5 text-[15px]">
          <li>Gunakan stadiometer atau papan tinggi yang dipasang tegak lurus di dinding. Anak tanpa alas kaki dan tanpa hiasan rambut tinggi.</li>
          <li>Tumit, bokong, bahu, dan belakang kepala menempel pada papan; kaki rapat, lengan lurus di sisi badan.</li>
          <li>Kepala tegak: garis dari lubang telinga ke sudut mata sejajar lantai (posisi Frankfort).</li>
          <li>Turunkan papan kepala sampai menempel ubun-ubun, baca dengan ketelitian 0,1 cm.</li>
        </ul>
      </Section>

      <Section title="Aturan usia dan koreksi 0,7 cm">
        <ul className="list-disc space-y-1 pl-5 text-[15px]">
          <li>Anak di bawah 24 bulan diukur berbaring (panjang badan); 24 bulan ke atas diukur berdiri (tinggi badan).</li>
          <li>Bila cara ukurnya tidak sesuai usia, hasilnya dikoreksi: anak di bawah 24 bulan yang diukur berdiri, tambahkan 0,7 cm; anak 24 bulan ke atas yang diukur berbaring, kurangi 0,7 cm (Permenkes 2/2020).</li>
          <li>SINDAPARKA melakukan koreksi ini otomatis sesuai cara ukur yang dipilih saat mencatat.</li>
        </ul>
      </Section>

      <Section title="Sumber resmi">
        <ul className="list-disc space-y-1 pl-5 text-[15px]">
          <li>Peraturan Menteri Kesehatan RI No. 2 Tahun 2020 tentang Standar Antropometri Anak.</li>
          <li>WHO Child Growth Standards (2006): pedoman pengukuran antropometri, who.int.</li>
          <li>Buku Kesehatan Ibu dan Anak (Buku KIA), Kementerian Kesehatan RI.</li>
          <li>Materi kesehatan anak di ayosehat.kemkes.go.id.</li>
        </ul>
        <p className="text-xs text-mute">
          Catatan kami: langkah-langkah di atas adalah saduran ringkas yang belum ditinjau petugas puskesmas setempat.
          Minta pembina posyandu memeriksa panduan ini sebelum dipakai untuk melatih kader baru.
        </p>
      </Section>
    </div>
  );
}
