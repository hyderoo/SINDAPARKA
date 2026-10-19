"use client";
import { useMemo, useState } from "react";
import { useScope } from "@/lib/scope";
import { addMonths, fmtMonthYear, todayISO } from "@/lib/age";
import { Logo } from "@/components/Shell";

export default function Laporan() {
  const sc = useScope();
  const today = todayISO();
  const months = Array.from({ length: 6 }, (_, i) => addMonths(today, -i).slice(0, 7));
  const [mon, setMon] = useState(months[0]);
  const data = useMemo(() => {
    if (!sc) return [];
    const list = sc.s.role !== "kader" ? sc.s.posyanduList.map((x) => x.name) : [sc.s.posyandu];
    return list.map((p) => {
      const kids = sc.rows.filter((r) => r.child.posyandu === p);
      // each child counted once, by their latest measurement inside the chosen month
      const cur = kids.map((k) => k.pts.filter((x) => x.m.date.startsWith(mon)).pop()).filter((x): x is NonNullable<typeof x> => !!x);
      const c = (f: (a: (typeof cur)[number]) => boolean) => cur.filter(f).length;
      return {
        p, terdaftar: kids.length, hadir: cur.length,
        pendek: c((x) => x.a.hfa != null && x.a.hfa < -2 && x.a.hfa >= -3),
        sangat: c((x) => x.a.severelyStunted),
        bbKurang: c((x) => x.a.wfa != null && x.a.wfa < -2),
        gizi: c((x) => x.a.wfh != null && x.a.wfh < -2),
        lebih: c((x) => x.a.wfh != null && x.a.wfh > 2),
      };
    });
  }, [sc, mon]);
  if (!sc) return null;
  const tot = data.reduce((a, d) => ({ terdaftar: a.terdaftar + d.terdaftar, hadir: a.hadir + d.hadir, pendek: a.pendek + d.pendek, sangat: a.sangat + d.sangat, bbKurang: a.bbKurang + d.bbKurang, gizi: a.gizi + d.gizi, lebih: a.lebih + d.lebih }), { terdaftar: 0, hadir: 0, pendek: 0, sangat: 0, bbKurang: 0, gizi: 0, lebih: 0 });
  const pct = (n: number, d: number) => (d ? ((n / d) * 100).toFixed(1).replace(".", ",") + "%" : "-");
  const csv = () => {
    const head = ["Posyandu", "Terdaftar", "Diukur bulan ini", "Pendek", "Sangat pendek", "BB kurang", "Gizi kurang/buruk (BB/TB)", "Gizi lebih (BB/TB)", "Prevalensi pendek"];
    const lines = [head, ...[...data.map((d) => ({ ...d })), { p: "TOTAL", ...tot }].map((d) => [d.p, d.terdaftar, d.hadir, d.pendek, d.sangat, d.bbKurang, d.gizi, d.lebih, pct(d.pendek + d.sangat, d.hadir)])];
    const body = "\ufeff" + lines.map((l) => l.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
    a.download = `laporan-sindaparka-${mon}.csv`;
    a.click();
  };
  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Laporan bulanan</h1>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <select className="field !min-h-11 col-span-2 sm:w-auto" aria-label="Bulan" value={mon} onChange={(e) => setMon(e.target.value)}>{months.map((m) => <option key={m} value={m}>{fmtMonthYear(m + "-01")}</option>)}</select>
          <button className="btn btn-ghost !min-h-11" onClick={csv}>Excel (CSV)</button>
          <button className="btn btn-primary !min-h-11" onClick={() => window.print()}>Cetak / PDF</button>
        </div>
      </div>
      <section className="card p-4 md:p-6">
        <div className="mb-4 flex items-center gap-3"><Logo size={32} /><div><div className="font-display text-xl font-semibold">Laporan penimbangan balita</div><div className="text-sm text-mute">{fmtMonthYear(mon + "-01")} · data demo sintetis</div></div></div>
        <p className="mb-1 text-xs text-mute md:hidden">Geser tabel ke samping untuk melihat semua kolom.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm tabular-nums">
            <thead><tr className="border-b-2 border-line text-left text-xs text-mute">
              {["Posyandu", "Terdaftar", "Diukur", "Pendek", "Sangat pendek", "BB kurang", "Gizi kurang/buruk", "Gizi lebih", "% pendek"].map((h) => <th key={h} className="px-2 py-2 font-bold">{h}</th>)}
            </tr></thead>
            <tbody>
              {[...data, { p: "TOTAL", ...tot }].map((d) => (
                <tr key={d.p} className={`border-b border-line ${d.p === "TOTAL" ? "bg-leaf-soft font-bold" : ""}`}>
                  <td className="px-2 py-3 font-bold">{d.p}</td><td className="px-2">{d.terdaftar}</td><td className="px-2">{d.hadir}</td><td className="px-2">{d.pendek}</td><td className="px-2">{d.sangat}</td><td className="px-2">{d.bbKurang}</td><td className="px-2">{d.gizi}</td><td className="px-2">{d.lebih}</td><td className="px-2">{pct(d.pendek + d.sangat, d.hadir)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-mute">Setiap anak dihitung sekali, dari pengukuran terakhirnya di bulan ini. Pendek = TB/U di bawah -2 SD. Klasifikasi mengikuti Permenkes 2/2020 tentang Standar Antropometri Anak (standar WHO 2006 untuk 0 sampai 60 bulan).</p>
      </section>
    </div>
  );
}
