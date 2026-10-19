"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useScope } from "@/lib/scope";
import { actions } from "@/lib/store";
import { Result } from "@/components/Result";
import { GrowthChart } from "@/components/GrowthChart";
import { EmptyState, StatusChip, zfmt } from "@/components/ui";
import { posLabel, ageInMonths, fmtAge, fmtDate, todayISO } from "@/lib/age";
import { remindersFor, VACCINES } from "@/lib/schedule";

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const sc = useScope();
  if (!sc) return null;
  const r = sc.rows.find((x) => x.child.id === id);
  if (!r) return <div className="card p-6">Anak tidak ditemukan. <Link className="font-bold text-leaf underline" href="/anak">Kembali ke daftar</Link></div>;
  const today = todayISO();
  const ageNow = ageInMonths(r.child.birth, today);
  const rem = remindersFor(r.child, sc.measurements.filter((m) => m.childId === id), today);
  return (
    <div className="space-y-5">
      <Link href="/anak" className="inline-flex min-h-11 items-center text-sm font-bold text-leaf">← Semua anak</Link>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-semibold">{r.child.name}</h1>
          <p className="text-sm text-mute">{r.child.sex === "L" ? "Laki-laki" : "Perempuan"} · lahir {fmtDate(r.child.birth)} · {fmtAge(ageNow)} · {posLabel(r.child.posyandu)}</p>
          <p className="text-sm text-mute">Orang tua: {r.child.guardian}</p>
        </div>
        <Link href={`/periksa?anak=${id}`} className="btn btn-primary w-full sm:w-auto">Catat penimbangan</Link>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="card min-w-0 p-5">
          <h2 className="mb-3 font-display text-xl font-semibold">Kurva pertumbuhan</h2>
          <GrowthChart sex={r.child.sex} pts={r.pts} />
          {r.trend === "falling" && <p className="mt-3 rounded-xl bg-sun-soft p-3 text-sm font-semibold text-[#7A5B00]">Kurva tinggi turun 0,25 SD atau lebih dalam 4 kunjungan terakhir.</p>}
        </section>
        <section className="card min-w-0 p-5">
          <h2 className="mb-3 font-display text-xl font-semibold">Penilaian terakhir</h2>
          {r.last ? <Result a={r.last.a} age={r.last.age} trend={r.trend} /> : <EmptyState compact icon="calendar" title="Belum ada penimbangan" text="Penilaian muncul setelah berat dan tinggi pertama dicatat."><Link href={`/periksa?anak=${id}`} className="btn btn-primary w-full">Catat penimbangan</Link></EmptyState>}
        </section>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 font-display text-xl font-semibold">Riwayat kunjungan</h2>
        <ol className="relative space-y-4 border-l-2 border-line pl-5">
          {[...r.pts].reverse().map((p) => (
            <li key={p.m.id} className="relative">
              <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-card bg-leaf" />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-bold">{fmtDate(p.m.date)}</span>
                <span className="text-xs text-mute">{fmtAge(p.age)}</span>
                <button className="ml-auto min-h-11 px-3 text-xs font-bold text-berry underline" onClick={() => { if (confirm("Hapus penimbangan ini?")) actions.deleteMeasurement(p.m.id); }}>Hapus</button>
              </div>
              <div className="text-sm tabular-nums">{p.m.weight.toString().replace(".", ",")} kg · {p.m.height.toString().replace(".", ",")} cm · z TB/U {zfmt(p.a.hfa)}</div>
              <div className="mt-1"><StatusChip s={p.a.sHfa} /></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-display text-xl font-semibold">Jadwal berikutnya</h2>
        <ul className="space-y-2">
          {rem.map((x) => (
            <li key={x.kind} className="flex items-center justify-between gap-3 rounded-xl bg-paper p-3">
              <span className="font-semibold">{x.title}</span>
              <span className={`chip ${x.overdue ? "chip-severe" : "chip-ok"}`}>{x.overdue ? `lewat ${-x.daysLeft} hari` : x.daysLeft === 0 ? "hari ini" : `${x.daysLeft} hari lagi`}</span>
            </li>
          ))}
          {rem.length === 0 && <li className="text-mute">Tidak ada jadwal dekat.</li>}
        </ul>
        <details className="mt-3 text-sm text-mute"><summary className="min-h-11 cursor-pointer font-bold">Jadwal imunisasi rutin bayi dan baduta (Kemenkes)</summary>
          <ul className="mt-2 space-y-1">{VACCINES.map((v) => <li key={v.month}>Usia {v.month} bln: {v.name}</li>)}</ul>
          <p className="mt-2 text-xs">Sumber: ayosehat.kemkes.go.id. Cek buku KIA dan arahan bidan untuk jadwal anak ini.</p>
        </details>
      </section>
    </div>
  );
}
