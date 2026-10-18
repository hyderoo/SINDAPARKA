"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { actions, useStore } from "@/lib/store";
import { POSYANDU } from "@/lib/seed";
import { Logo } from "@/components/Shell";

export default function Landing() {
  const router = useRouter();
  const s = useStore();
  const [pos, setPos] = useState(POSYANDU[0]);
  const go = (role: "kader" | "admin") => {
    actions.login(role, pos);
    router.push("/dashboard");
  };
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
          {["Standar WHO 2006, klasifikasi sesuai Permenkes 2/2020", "Tetap jalan tanpa sinyal, simpan dulu sinkron belakangan", "Laporan bulanan siap cetak atau unduh Excel"].map((x) => (
            <li key={x} className="flex gap-2"><span className="text-leaf">✓</span>{x}</li>
          ))}
        </ul>
        <p className="mt-6 max-w-md text-xs text-mute">Proyek tim bersama BKKBN untuk kader posyandu Parakan Kauman, Temanggung. Versi demo ini memakai data sintetis dan bukan alat diagnosis medis.</p>
      </section>

      <section className="card rise p-6" style={{ animationDelay: "0.08s" }}>
        <h2 className="font-display text-2xl font-semibold">Masuk ke demo</h2>
        <p className="mt-1 text-sm text-mute">Pilih peran untuk mencoba. Tanpa akun, data hanya ada di perangkat ini.</p>
        <label className="label mt-5" htmlFor="pos">Posyandu (untuk peran kader)</label>
        <select id="pos" className="field" value={pos} onChange={(e) => setPos(e.target.value)}>
          {POSYANDU.map((p) => <option key={p}>{p}</option>)}
        </select>
        <button className="btn btn-primary mt-4 w-full" onClick={() => go("kader")}>Masuk sebagai kader</button>
        <button className="btn btn-ghost mt-3 w-full" onClick={() => go("admin")}>Masuk sebagai admin puskesmas</button>
        {s && s.role && <button className="mt-3 w-full text-sm font-bold text-leaf underline" onClick={() => router.push("/dashboard")}>Lanjutkan sesi sebelumnya</button>}
        <p className="mt-4 text-xs text-mute">Kader melihat data posyandunya. Admin melihat semua posyandu dan laporan gabungan.</p>
      </section>
    </main>
  );
}
