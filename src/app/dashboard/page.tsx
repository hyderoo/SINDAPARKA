"use client";
import Link from "next/link";
import { useScope } from "@/lib/scope";
import { prevalence, priority } from "@/lib/analytics";
import { POSYANDU } from "@/lib/seed";
import { StatusChip } from "@/components/ui";
import { fmtAge, fmtMonthYear, todayISO, addMonths } from "@/lib/age";
import { t } from "@/lib/i18n";

export default function Dashboard() {
  const sc = useScope();
  if (!sc) return null;
  const { s, rows } = sc;
  const lang = s.lang;
  const pv = prevalence(rows);
  const alerts = rows.filter((r) => priority(r) > 0).sort((a, b) => priority(b) - priority(a));
  const falling = rows.filter((r) => r.trend === "falling" && !r.last?.a.stunted).length;
  const byPos = (s.role === "admin" ? POSYANDU : [s.posyandu]).map((p) => {
    const rr = rows.filter((r) => r.child.posyandu === p);
    return { p, ...prevalence(rr), total: rr.length };
  });
  // prevalence trend over the last 6 months, using each child's latest measurement up to that month
  const today = todayISO();
  const trend = Array.from({ length: 6 }, (_, i) => {
    const end = addMonths(today, -(5 - i));
    let n = 0, st = 0;
    rows.forEach((r) => {
      const p = [...r.pts].filter((x) => x.m.date <= end).pop();
      if (p && p.a.hfa != null) { n++; if (p.a.stunted) st++; }
    });
    return { label: fmtMonthYear(end).split(" ")[0], pct: n ? (st / n) * 100 : 0 };
  });
  const maxT = Math.max(20, ...trend.map((x) => x.pct));

  return (
    <div className="space-y-5">
      <header className="rise">
        <p className="text-sm font-bold text-mute">{t(lang, "hello")}, {s.role === "admin" ? "Admin" : `Kader ${s.posyandu}`}</p>
        <h1 className="font-display text-3xl font-semibold md:text-4xl">Kondisi balita bulan ini</h1>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t(lang, "children")} value={String(rows.length)} />
        <Stat label={t(lang, "stunting")} value={`${pv.pct.toFixed(1).replace(".", ",")}%`} tone={pv.pct >= 20 ? "bad" : "ok"} sub={`${pv.stunted} dari ${pv.n} anak`} />
        <Stat label="Sangat pendek" value={String(pv.severe)} tone={pv.severe ? "bad" : "ok"} sub="z-score di bawah -3" />
        <Stat label={t(lang, "falling")} value={String(falling)} tone={falling ? "warn" : "ok"} sub="tinggi turun 4 kunjungan terakhir" />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-xl font-semibold">Tren pendek (stunting), 6 bulan</h2>
          <svg viewBox="0 0 320 150" className="mt-3 w-full" role="img" aria-label="Grafik batang persentase anak pendek per bulan">
            {trend.map((x, i) => {
              const h = (x.pct / maxT) * 100;
              return (
                <g key={i}>
                  <rect x={12 + i * 51} y={115 - h} width="34" height={h} rx="8" fill={i === 5 ? "#E8710A" : "#0B63CE"} opacity={i === 5 ? 1 : 0.8} />
                  <text x={29 + i * 51} y={108 - h} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1F2937">{x.pct.toFixed(0)}%</text>
                  <text x={29 + i * 51} y={138} textAnchor="middle" fontSize="11" fill="#5F6B7A">{x.label}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-xl font-semibold">{s.role === "admin" ? "Per posyandu" : "Posyandu Anda"}</h2>
          <div className="mt-3 space-y-3">
            {byPos.map((b) => (
              <div key={b.p}>
                <div className="flex justify-between text-sm font-bold"><span>Posyandu {b.p}</span><span className="tabular-nums">{b.pct.toFixed(1).replace(".", ",")}% · {b.total} anak</span></div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-leaf-soft"><div className="h-full rounded-full" style={{ width: `${Math.min(100, b.pct * 2.5)}%`, background: b.pct >= 20 ? "#E8710A" : "#0B63CE" }} /></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-mute">Batang penuh = 40%. Garis acuan nasional 2024: target di bawah 14%.</p>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">{t(lang, "attention")}</h2>
          <Link href="/periksa" className="btn btn-primary !min-h-11">{t(lang, "new_measure")}</Link>
        </div>
        {alerts.length === 0 && <p className="mt-3 text-mute">Tidak ada anak yang perlu perhatian khusus.</p>}
        <ul className="mt-3 divide-y divide-line">
          {alerts.slice(0, 8).map((r) => (
            <li key={r.child.id}>
              <Link href={`/anak/${r.child.id}`} className="flex min-h-16 flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
                  <div className="truncate font-bold">{r.child.name}</div>
                  <div className="text-xs text-mute">{fmtAge(r.last!.age)} · Posyandu {r.child.posyandu}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <StatusChip s={r.last!.a.sHfa} />
                  {r.trend === "falling" && <span className="chip chip-watch">↘ Kurva turun</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, sub, tone = "ok" }: { label: string; value: string; sub?: string; tone?: "ok" | "warn" | "bad" }) {
  const c = tone === "bad" ? "text-clay" : tone === "warn" ? "text-[#9A6B00]" : "text-leaf";
  return (
    <div className="card rise p-4">
      <div className="text-xs font-bold text-mute">{label}</div>
      <div className={`font-display text-4xl font-semibold tabular-nums ${c}`}>{value}</div>
      {sub && <div className="text-xs text-mute">{sub}</div>}
    </div>
  );
}
