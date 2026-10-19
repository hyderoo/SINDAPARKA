"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useScope } from "@/lib/scope";
import { adviceFor } from "@/lib/advice";
import { ageInMonths, fmtAge, fmtDate, todayISO } from "@/lib/age";
import { posLabel } from "@/lib/age";
import { EmptyState, zfmt } from "@/components/ui";
import { NOTE_CONF, NOTE_TOOL } from "@/lib/report";

export default function Rujukan() {
  const { id } = useParams<{ id: string }>();
  const sc = useScope();
  const [extra, setExtra] = useState("");
  if (!sc) return null;
  const r = sc.rows.find((x) => x.child.id === id);
  if (!r) return <div className="card p-6">Anak tidak ditemukan. <Link className="font-bold text-leaf underline" href="/anak">Kembali ke daftar</Link></div>;
  const { child } = r;
  const today = todayISO();
  const ageNow = ageInMonths(child.birth, today);
  const pk = sc.s.puskesmasList.find((x) => x.id === sc.s.posyanduList.find((p) => p.id === child.posyanduId)?.puskesmasId)?.name ?? "Puskesmas setempat";
  const last = r.last;
  const adv = last ? adviceFor(last.a, last.age, r.trend) : null;
  const alasan: string[] = [];
  if (last) {
    if (last.a.severelyStunted) alasan.push(`Sangat pendek (TB/U z-score ${zfmt(last.a.hfa)} SD)`);
    else if (last.a.stunted) alasan.push(`Pendek, berisiko stunting (TB/U z-score ${zfmt(last.a.hfa)} SD)`);
    if (last.a.sWfa?.level === "severe") alasan.push(`Berat badan sangat kurang (BB/U z-score ${zfmt(last.a.wfa)} SD)`);
    else if (last.a.sWfa?.level === "moderate") alasan.push(`Berat badan kurang (BB/U z-score ${zfmt(last.a.wfa)} SD)`);
    if (last.a.sWfh?.level === "severe") alasan.push(`Gizi buruk (BB/TB z-score ${zfmt(last.a.wfh)} SD)`);
    else if (last.a.sWfh?.level === "moderate") alasan.push(`Gizi kurang (BB/TB z-score ${zfmt(last.a.wfh)} SD)`);
    if (r.trend === "falling") alasan.push("Kurva tinggi turun dalam 4 kunjungan terakhir");
  }
  if (alasan.length === 0 && last) alasan.push("Pemeriksaan pertumbuhan lanjutan sesuai anjuran kader");
  const kader = sc.s.role === "kader" ? sc.s.fullName || "-" : sc.s.fullName || "-";

  return (
    <div className="space-y-4">
      <Link href={`/anak/${id}`} className="no-print inline-flex min-h-11 items-center text-sm font-bold text-leaf">&larr; Kembali ke halaman anak</Link>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Surat rujukan</h1>
        <button className="btn btn-primary" onClick={() => window.print()}>Cetak / PDF</button>
      </div>
      {!last && (
        <div className="no-print">
          <EmptyState icon="calendar" title="Belum ada penimbangan" text="Surat rujukan memakai hasil penimbangan terakhir. Catat dulu berat dan tinggi anak.">
            <Link href={`/periksa?anak=${id}`} className="btn btn-primary w-full">Catat penimbangan</Link>
          </EmptyState>
        </div>
      )}
      {last && (
        <>
          <section className="no-print card space-y-3 p-5">
            <h2 className="font-display text-xl font-semibold">Periksa sebelum mencetak</h2>
            <p className="text-sm text-mute">Surat diisi otomatis dari data {child.name} dan penimbangan {fmtDate(last.m.date)}. Alasan rujukan mengikuti hasil penilaian terakhir.</p>
            <div>
              <label className="label" htmlFor="catatan">Catatan tambahan untuk petugas (opsional)</label>
              <textarea id="catatan" rows={3} className="field !h-auto w-full" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Misalnya: anak sedang batuk sejak 3 hari, nafsu makan menurun." />
            </div>
            <p className="text-xs text-mute">{NOTE_TOOL} Surat ini dibuat kader untuk memudahkan rujukan, bukan surat rujukan resmi fasilitas kesehatan.</p>
          </section>

          <div className="print-letter">
            <div style={{ textAlign: "center", borderBottom: "1.5pt solid #0b63ce", paddingBottom: "6pt", marginBottom: "10pt" }}>
              <div style={{ fontSize: "15pt", fontWeight: 700, color: "#0b63ce" }}>SURAT RUJUKAN POSYANDU</div>
              <div style={{ fontSize: "9pt" }}>{posLabel(child.posyandu)} &middot; {pk}</div>
            </div>
            <p>Kepada Yth. <b>Petugas Kesehatan {pk}</b> di tempat.</p>
            <p>Mohon pemeriksaan dan penanganan lebih lanjut untuk anak berikut:</p>
            <table style={{ margin: "6pt 0" }}>
              <tbody>
                <tr><th style={{ width: "34%" }}>Nama anak</th><td>{child.name}</td></tr>
                <tr><th>Jenis kelamin</th><td>{child.sex === "L" ? "Laki-laki" : "Perempuan"}</td></tr>
                <tr><th>Tanggal lahir / umur</th><td>{fmtDate(child.birth)} ({fmtAge(ageNow)})</td></tr>
                <tr><th>Nama orang tua/wali</th><td>{child.guardian}</td></tr>
                <tr><th>Posyandu</th><td>{posLabel(child.posyandu)}</td></tr>
              </tbody>
            </table>
            <p style={{ marginBottom: "3pt" }}><b>Hasil pengukuran terakhir</b> ({fmtDate(last.m.date)}, usia {last.age} bulan):</p>
            <table style={{ margin: "0 0 6pt" }}>
              <tbody>
                <tr><th style={{ width: "34%" }}>Berat badan</th><td>{String(last.m.weight).replace(".", ",")} kg</td></tr>
                <tr><th>Panjang/tinggi badan</th><td>{String(last.m.height).replace(".", ",")} cm ({(last.m.lying ?? last.age <= 24) ? "berbaring" : "berdiri"})</td></tr>
                <tr><th>TB/U (z-score)</th><td>{zfmt(last.a.hfa)} SD &middot; {last.a.sHfa?.label ?? "-"}</td></tr>
                <tr><th>BB/U (z-score)</th><td>{zfmt(last.a.wfa)} SD &middot; {last.a.sWfa?.label ?? "-"}</td></tr>
                <tr><th>BB/TB (z-score)</th><td>{zfmt(last.a.wfh)} SD &middot; {last.a.sWfh?.label ?? "-"}</td></tr>
                <tr><th>IMT/U (z-score)</th><td>{zfmt(last.a.bfa)} SD &middot; {last.a.sBfa?.label ?? "-"}</td></tr>
              </tbody>
            </table>
            <p style={{ marginBottom: "3pt" }}><b>Alasan rujukan:</b></p>
            <ul style={{ margin: "0 0 6pt 14pt", padding: 0 }}>
              {alasan.map((a) => <li key={a} style={{ listStyle: "disc" }}>{a}</li>)}
            </ul>
            {adv && adv.bullets.length > 0 && (
              <>
                <p style={{ marginBottom: "3pt" }}><b>Yang sudah disarankan kepada orang tua:</b></p>
                <ul style={{ margin: "0 0 6pt 14pt", padding: 0 }}>
                  {adv.bullets.slice(0, 4).map((b) => <li key={b} style={{ listStyle: "disc" }}>{b}</li>)}
                </ul>
              </>
            )}
            {extra.trim() && <p><b>Catatan kader:</b> {extra.trim()}</p>}
            <p>Demikian surat rujukan ini kami buat untuk ditindaklanjuti. Atas perhatian dan bantuannya kami ucapkan terima kasih.</p>
            <div className="sig" style={{ display: "flex", justifyContent: "space-between", marginTop: "14pt" }}>
              <div style={{ width: "45%", textAlign: "center" }}>
                <div>Orang tua/wali</div>
                <div style={{ height: "40pt" }} />
                <div style={{ borderTop: "0.5pt solid #111827", paddingTop: "2pt" }}>({child.guardian !== "-" ? child.guardian : "nama dan tanda tangan"})</div>
              </div>
              <div style={{ width: "45%", textAlign: "center" }}>
                <div>{fmtDate(today)}<br />Kader posyandu</div>
                <div style={{ height: "40pt" }} />
                <div style={{ borderTop: "0.5pt solid #111827", paddingTop: "2pt" }}>({kader})</div>
              </div>
            </div>
            <p style={{ fontSize: "8pt", color: "#374151", marginTop: "10pt" }}>{NOTE_TOOL}</p>
            <p style={{ fontSize: "8pt", fontWeight: 700, color: "#b3261e", marginTop: "2pt" }}>{NOTE_CONF}</p>
          </div>
        </>
      )}
    </div>
  );
}
