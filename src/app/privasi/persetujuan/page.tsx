import Link from "next/link";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Formulir persetujuan orang tua - SINDAPARKA" };

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-base font-bold text-leaf-deep">{children}</h2>;
}
// Hand-written fill line for the printed form
function Line({ w = "w-full", label }: { w?: string; label: string }) {
  return (
    <div className="flex items-end gap-2">
      <span className="shrink-0">{label}</span>
      <span className={`inline-block border-b border-dotted border-stone-500 ${w}`} style={{ minWidth: 60, height: "1.1em" }} />
    </div>
  );
}

export default function Persetujuan() {
  return (
    <main className="mx-auto max-w-2xl p-4 md:p-8 print-onepage">
      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href="/privasi" className="inline-flex min-h-11 items-center text-sm font-bold text-leaf">&larr; Privasi dan data anak</Link>
        <span className="sm:ml-auto"><PrintButton /></span>
      </div>

      <p className="no-print mb-4 rounded-xl bg-sun-soft p-3 text-sm font-semibold text-[#7A5B00]">
        Ini rancangan formulir dari tim pengembang berdasarkan UU No. 27 Tahun 2022. Belum ditinjau puskesmas, Dinas Kesehatan, atau pihak hukum. Cetak dan pakai hanya setelah pengendali data (puskesmas) menyetujuinya.
      </p>

      <div className="card space-y-4 p-5 text-[13px] leading-snug print-consent">
        <header className="space-y-1 border-b border-line pb-3">
          <h1 className="font-display text-xl font-bold">Formulir persetujuan orang tua/wali</h1>
          <p className="text-sm font-semibold">Pencatatan data anak di aplikasi SINDAPARKA untuk pemantauan pertumbuhan di posyandu</p>
          <p className="text-xs text-mute">Rancangan - berlaku setelah ditetapkan pengendali data (puskesmas)</p>
        </header>

        <section className="space-y-2">
          <H>Penjelasan untuk Bapak/Ibu orang tua atau wali</H>
          <ul className="list-disc space-y-1 pl-5">
            <li>Posyandu memakai aplikasi SINDAPARKA untuk mencatat berat badan, tinggi atau panjang badan, dan imunisasi anak setiap bulan. Tujuannya satu: pertumbuhan anak terpantau dan anak yang perlu bantuan gizi cepat dirujuk ke puskesmas.</li>
            <li>Data yang dicatat: nama anak, jenis kelamin, tanggal lahir, nama orang tua/wali, hasil timbang dan ukur, serta tanggal imunisasi.</li>
            <li>Yang boleh melihat data anak Bapak/Ibu hanya: kader posyandu anak Bapak/Ibu, tenaga kesehatan puskesmas, dan admin yang ditunjuk puskesmas. Orang tua lain <b>tidak bisa</b> melihatnya.</li>
            <li>Rekap untuk laporan hanya berupa jumlah dan persentase per posyandu. Kelompok berisi kurang dari 10 anak tidak ditampilkan, supaya anak tidak bisa dikenali.</li>
            <li>Data disimpan di server (Supabase, wilayah Sydney, Australia) dengan koneksi terenkripsi.</li>
            <li>Menurut UU No. 27 Tahun 2022, Bapak/Ibu berhak: melihat data anak, meminta perbaikan, meminta penghapusan, dan menarik persetujuan ini kapan saja lewat kader atau puskesmas. Penarikan tidak membatalkan pencatatan yang sudah terjadi.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <H>Pernyataan persetujuan</H>
          <p>Saya yang bertanda tangan di bawah ini menyatakan:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Saya sudah membaca atau dibacakan penjelasan di atas dan memahaminya.</li>
            <li>Saya <b>setuju</b> data anak saya dicatat di SINDAPARKA untuk tujuan pemantauan pertumbuhan di posyandu.</li>
            <li>Saya tahu persetujuan ini bisa saya tarik kapan saja.</li>
          </ol>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Line label="Nama anak" />
          <Line label="Tanggal lahir anak" />
          <Line label="Posyandu" />
          <Line label="Nama orang tua/wali" />
          <Line label="Hubungan dengan anak" />
          <Line label="Tanggal" />
        </section>

        <section className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <p className="mb-1">Kader yang memberi penjelasan,</p>
            <div className="sig-box rounded-lg border border-dashed border-stone-400" style={{ height: 70 }} />
            <p className="mt-1 text-xs text-mute">(nama jelas dan tanda tangan)</p>
          </div>
          <div>
            <p className="mb-1">Orang tua/wali,</p>
            <div className="sig-box rounded-lg border border-dashed border-stone-400" style={{ height: 70 }} />
            <p className="mt-1 text-xs text-mute">(nama jelas dan tanda tangan)</p>
          </div>
        </section>

        <footer className="border-t border-line pt-2 text-xs text-mute">
          <p>Dasar rancangan: UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi - data anak dan data kesehatan termasuk data pribadi spesifik (Pasal 4 ayat (2)); pemrosesan data anak wajib dengan persetujuan orang tua dan/atau wali (Pasal 25); persetujuan tertulis atau terekam, elektronik atau nonelektronik (Pasal 22); pengendali wajib menunjukkan bukti persetujuan (Pasal 24). Teks lengkap: peraturan.go.id.</p>
          <p className="mt-1">Kontak pengendali data untuk pertanyaan atau penarikan persetujuan: (diisi puskesmas) ........................</p>
        </footer>
      </div>
    </main>
  );
}
