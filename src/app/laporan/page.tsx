"use client";
import { useState } from "react";
import { useScope } from "@/lib/scope";
import { addMonths, fmtDate, fmtMonthYear, todayISO } from "@/lib/age";
import { buildReport, buildXlsx, NOTE_CONF, NOTE_FORMAT, NOTE_METHOD, NOTE_TOOL, pct } from "@/lib/report";

export default function Laporan() {
  const sc = useScope();
  const today = todayISO();
  const months = Array.from({ length: 6 }, (_, i) => addMonths(today, -i).slice(0, 7));
  const [mon, setMon] = useState(months[0]);
  const [busy, setBusy] = useState(false);
  if (!sc) return null;
  const rep = buildReport({
    rows: sc.rows,
    posyanduNames: sc.s.role !== "kader" ? sc.s.posyanduList.map((x) => x.name) : [sc.s.posyandu],
    month: mon,
    puskesmas: [...new Set(sc.s.posyanduList.filter((x) => sc.s.role !== "kader" || x.name === sc.s.posyandu).map((x) => sc.s.puskesmasList.find((p) => p.id === x.puskesmasId)?.name).filter(Boolean))].join(", ") || "-",
    scopeLabel: sc.s.role !== "kader" ? "Semua posyandu" : sc.s.posyandu,
    todayIso: today,
  });
  const xlsx = async () => {
    setBusy(true);
    try {
      const blob = await buildXlsx(rep);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `laporan-sindaparka-${mon}.xlsx`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } finally { setBusy(false); }
  };
  const T = rep.total;
  // Monthly stunting trend per posyandu: each child's latest measurement up to the end of that month.
  const trendMonths = [...months].reverse(); // oldest -> newest
  const trendPos = (sc.s.role !== "kader" ? sc.s.posyanduList.map((x) => x.name) : [sc.s.posyandu]).map((p) => {
    const rr = sc.rows.filter((r) => r.child.posyandu === p);
    const cells = trendMonths.map((m) => {
      const end = addMonths(m + "-01", 1); // first day of the next month
      let n = 0, st = 0;
      rr.forEach((r) => {
        const pt = [...r.pts].filter((x) => x.m.date < end).pop();
        if (pt && pt.a.hfa != null) { n++; if (pt.a.stunted) st++; }
      });
      return { n, pct: n ? (st / n) * 100 : 0 };
    });
    return { p, cells };
  }).filter((x) => x.cells.some((c) => c.n > 0));
  const lv = (x: { level: string } | null) => (x ? `lv-${x.level}` : "");
  const z = (v: number | null) => (v == null ? "-" : v.toFixed(2).replace(".", ","));
  const n1 = (v: number) => v.toFixed(1).replace(".", ",");
  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-end justify-between gap-3 print:hidden">
        <h1 className="font-display text-3xl font-semibold">Laporan bulanan</h1>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <select className="field !min-h-11 col-span-2 sm:w-auto" aria-label="Bulan" value={mon} onChange={(e) => setMon(e.target.value)}>{months.map((m) => <option key={m} value={m}>{fmtMonthYear(m + "-01")}</option>)}</select>
          <button className="btn btn-ghost !min-h-11 whitespace-nowrap" onClick={xlsx} disabled={busy}>{busy ? "Menyiapkan..." : "Unduh Excel"}</button>
          <button className="btn btn-primary !min-h-11 whitespace-nowrap" onClick={() => window.print()}>Cetak / PDF</button>
        </div>
      </div>
      <section className="card p-4 md:p-6 print:hidden">
        <div className="mb-4">
          <div className="font-display text-xl font-semibold">Laporan penimbangan balita</div>
          <div className="text-sm text-mute">{rep.periodLabel} · {rep.puskesmas} · {rep.posyanduScope}</div>
        </div>
        <p className="mb-1 text-xs text-mute md:hidden">Geser tabel ke samping untuk melihat semua kolom.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm tabular-nums">
            <thead><tr className="border-b-2 border-line text-left text-xs text-mute">
              {["Posyandu", "Terdaftar", "Diukur", "Pendek", "Sangat pendek", "BB kurang", "Gizi kurang/buruk", "Gizi lebih", "% pendek"].map((h) => <th key={h} className="px-2 py-2 font-bold">{h}</th>)}
            </tr></thead>
            <tbody>
              {[...rep.sums, T].map((d) => (
                <tr key={d.p} className={`border-b border-line ${d.p === "TOTAL" ? "bg-leaf-soft font-bold" : ""}`}>
                  <td className="px-2 py-3 font-bold">{d.p}</td><td className="px-2">{d.terdaftar}</td><td className="px-2">{d.hadir}</td><td className="px-2">{d.pendek}</td><td className="px-2">{d.sangat}</td><td className="px-2">{d.bbKurang}</td><td className="px-2">{d.gizi}</td><td className="px-2">{d.lebih}</td><td className="px-2">{pct(d.pendek + d.sangat, d.hadir)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-mute">{NOTE_METHOD}</p>
        <p className="mt-2 text-xs text-mute">Unduhan Excel berisi dua lembar: Ringkasan dan Data anak (nama, umur, berat, tinggi, z-score, status). {NOTE_FORMAT}</p>
      </section>

      <section className="card p-4 md:p-6 print:hidden">
        <h2 className="font-display text-xl font-semibold">Tren bulanan per posyandu</h2>
        <p className="mt-1 text-xs text-mute">Persentase anak pendek (z-score TB/U di bawah -2) memakai pengukuran terakhir setiap anak sampai akhir bulan itu. Tanda · berarti kurang dari 10 anak terukur, terlalu sedikit untuk persentase yang berarti.</p>
        <p className="mb-1 mt-2 text-xs text-mute md:hidden">Geser tabel ke samping untuk melihat semua bulan.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm tabular-nums">
            <thead><tr className="border-b-2 border-line text-left text-xs text-mute">
              <th className="px-2 py-2 font-bold">Posyandu</th>
              {trendMonths.map((m) => <th key={m} className="px-2 py-2 text-right font-bold">{fmtMonthYear(m + "-01")}</th>)}
            </tr></thead>
            <tbody>
              {trendPos.map((x) => (
                <tr key={x.p} className="border-b border-line">
                  <td className="px-2 py-3 font-bold">{x.p}</td>
                  {x.cells.map((c, i) => (
                    <td key={i} className="px-2 text-right">
                      {c.n < 10 ? <span className="text-mute">·</span> : (
                        <span className={`font-bold ${c.pct >= 20 ? "text-clay" : "text-ink"}`}>{c.pct.toFixed(0)}%</span>
                      )}
                      {c.n > 0 && <span className="block text-[10px] text-mute">{c.n} anak</span>}
                    </td>
                  ))}
                </tr>
              ))}
              {trendPos.length === 0 && <tr><td colSpan={trendMonths.length + 1} className="px-2 py-4 text-mute">Belum ada pengukuran pada 6 bulan terakhir.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-mute">Oranye berarti 20% atau lebih, di atas prevalensi nasional 19,8% (SSGI 2024).</p>
      </section>

      {/* Print template (A4 landscape). Hidden on screen, shown when printing or saving as PDF. */}
      <div className="print-doc">
        <div style={{ display: "flex", alignItems: "center", gap: "10pt", borderBottom: "1.5pt solid #0b63ce", paddingBottom: "6pt", marginBottom: "8pt" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/bkkbn.png" alt="BKKBN" style={{ height: "30pt", width: "auto" }} />
          <span style={{ width: "0.5pt", height: "26pt", background: "#9aa5b4" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/undip.png" alt="Universitas Diponegoro" style={{ height: "30pt", width: "auto" }} />
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: "14pt", fontWeight: 700, color: "#0b63ce" }}>LAPORAN PENIMBANGAN BALITA</div>
            <div style={{ fontSize: "9pt" }}>Puskesmas: <b>{rep.puskesmas}</b> · Posyandu: <b>{rep.posyanduScope}</b> · Periode: <b>{rep.periodLabel}</b></div>
          </div>
        </div>
        <p style={{ fontSize: "8pt", color: "#5f6b7a", margin: "0 0 6pt" }}>{NOTE_FORMAT}</p>
        <div style={{ fontWeight: 700, margin: "4pt 0" }}>A. Ringkasan</div>
        <table style={{ textAlign: "center" }}>
          <thead><tr>{["Posyandu", "Terdaftar", "Diukur", "Pendek", "Sangat pendek", "BB kurang", "Gizi kurang/buruk", "Gizi lebih", "Kurva turun", "% pendek"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {[...rep.sums, T].map((d) => (
              <tr key={d.p} style={d.p === "TOTAL" ? { fontWeight: 700, background: "#eaf2fc" } : undefined}>
                <td style={{ textAlign: "left" }}>{d.p}</td><td>{d.terdaftar}</td><td>{d.hadir}</td><td>{d.pendek}</td><td>{d.sangat}</td><td>{d.bbKurang}</td><td>{d.gizi}</td><td>{d.lebih}</td><td>{d.falling}</td><td>{pct(d.pendek + d.sangat, d.hadir)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontWeight: 700, margin: "10pt 0 4pt" }}>B. Data per anak ({rep.kids.length} anak diukur)</div>
        <table style={{ textAlign: "center" }}>
          <thead><tr>{["No", "Posyandu", "Nama anak", "JK", "Tgl lahir", "Tgl ukur", "Umur (bln)", "BB (kg)", "PB/TB (cm)", "Cara ukur", "Z BB/U", "Z TB/U", "Z BB/TB", "Status TB/U", "Status BB/TB"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {rep.kids.map((k) => (
              <tr key={k.no + k.name}>
                <td>{k.no}</td><td style={{ textAlign: "left" }}>{k.posyandu}</td><td style={{ textAlign: "left" }}>{k.name}</td><td>{k.sex}</td><td>{fmtDate(k.birth)}</td><td>{fmtDate(k.date)}</td><td>{k.age}</td><td>{n1(k.weight)}</td><td>{n1(k.height)}</td><td>{k.posture}</td><td>{z(k.zWfa)}</td><td>{z(k.zHfa)}</td><td>{z(k.zWfh)}</td>
                <td className={lv(k.sHfa)}>{k.sHfa?.label ?? "-"}{k.falling ? " ↘" : ""}</td><td className={lv(k.sWfh)}>{k.sWfh?.label ?? "-"}</td>
              </tr>
            ))}
            {rep.kids.length === 0 && <tr><td colSpan={15} style={{ padding: "8pt" }}>Belum ada pengukuran pada periode ini.</td></tr>}
          </tbody>
        </table>
        <p style={{ fontSize: "8pt", color: "#374151", margin: "6pt 0 0" }}>{NOTE_METHOD} ↘ = kurva tinggi turun. Z BB/U = berat menurut umur.</p>
        <p style={{ fontSize: "8pt", margin: "2pt 0 0" }}>Dicetak dari SINDAPARKA pada {rep.generated}. {NOTE_TOOL}</p>
        <p style={{ fontSize: "8pt", fontWeight: 700, color: "#b3261e", margin: "2pt 0 0" }}>{NOTE_CONF}</p>
        <div className="sig" style={{ display: "flex", justifyContent: "space-between", marginTop: "6pt", fontSize: "9pt" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: "30%", textAlign: "center" }}>
              <div style={{ whiteSpace: "pre-line", minHeight: "22pt" }}>{i === 0 ? "Mengetahui,\nKepala Puskesmas" : i === 1 ? "\nPetugas gizi / pembina posyandu" : "\nKader posyandu"}</div>
              <div style={{ height: "28pt" }} />
              <div style={{ borderTop: "0.5pt solid #111827", paddingTop: "2pt" }}>(Nama dan tanda tangan)</div>
              <div style={{ fontSize: "8pt", color: "#5f6b7a" }}>Tanggal: ____ / ____ / ________</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
