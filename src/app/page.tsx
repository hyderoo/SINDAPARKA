"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/Shell";
import { Partners } from "@/components/Partners";

export default function Landing() {
  const router = useRouter();
  const s = useStore();
  useEffect(() => {
    if (s?.userId) router.replace(s.status === "active" ? "/dashboard" : "/menunggu");
  }, [s?.userId, s?.status, router]);
  return (
    <main className="mx-auto grid min-h-dvh max-w-5xl items-center gap-10 px-5 py-10 md:grid-cols-[1.1fr_1fr]">
      <section className="rise">
        <div className="mb-6 flex items-center gap-3">
          <Logo size={44} />
          <span className="font-display text-2xl font-bold">SINDAPARKA</span>
        </div>
        <h1 className="font-display text-[2.1rem] font-semibold leading-[1.1] md:text-5xl">
          Timbang hari ini,
          <br />
          <span className="text-leaf">lihat arah pertumbuhannya.</span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-mute">
          Alat bantu kader posyandu: catat berat dan tinggi balita, hitung z-score WHO otomatis, dan dapat saran yang mudah dijelaskan ke orang tua.
        </p>
        <ul className="mt-6 grid gap-2 text-[15px] font-semibold">
          {["Klasifikasi sesuai Permenkes 2/2020 dengan standar WHO 2006", "Kader hanya melihat anak di posyandunya", "Laporan bulanan siap cetak atau unduh Excel"].map((x) => (
            <li key={x} className="flex gap-2"><span className="text-leaf">✓</span>{x}</li>
          ))}
        </ul>
        <p className="mt-6 max-w-md text-xs text-mute">Ini alat bantu, bukan alat diagnosis medis.</p>
        <Partners />
      </section>

      <section className="card rise p-6" style={{ animationDelay: "0.08s" }}>
        <h2 className="font-display text-2xl font-semibold">Mulai</h2>
        <p className="mt-1 text-sm text-mute">Masuk dengan akun Anda. Akun baru perlu disetujui admin puskesmas.</p>
        <Link href="/masuk" className="btn btn-primary mt-5 w-full">Masuk</Link>
        <Link href="/daftar" className="btn btn-ghost mt-3 w-full">Daftar akun</Link>
        <p className="mt-4 text-xs text-mute"><Link href="/privasi" className="underline">Privasi data anak</Link> · <Link href="/metode" className="underline">Cara hitung dan batasannya</Link></p>
      </section>
    </main>
  );
}
