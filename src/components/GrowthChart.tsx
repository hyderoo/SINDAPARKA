"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { correctHeight, curve, type Sex } from "@/lib/who";
import type { Point } from "@/lib/analytics";

const PAD = { l: 40, r: 14, t: 14, b: 32 };

export function GrowthChart({ sex, pts }: { sex: Sex; pts: Point[] }) {
  const [ind, setInd] = useState<"hfa" | "wfa">("hfa");
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(340);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(260, Math.round(el.clientWidth))));
    ro.observe(el);
    setW(Math.max(260, Math.round(el.clientWidth)));
    return () => ro.disconnect();
  }, []);
  const H = W < 480 ? 320 : 380;
  const ages = pts.map((p) => p.age);
  const span = ages.length ? Math.max(...ages) - Math.min(...ages) : 60;
  const zoom = ages.length > 0 && span <= 30;
  const lo = zoom ? Math.max(0, Math.floor(Math.min(...ages)) - 3) : 0;
  const hi = zoom ? Math.min(60, Math.max(lo + 12, Math.ceil(Math.max(...ages)) + 3)) : 60;
  
  const zs = [-3, -2, 0, 2, 3];
  const cs = useMemo(() => curve(ind, sex, zs), [ind, sex]);
    const val = (p: Point) => (ind === "hfa" ? correctHeight(p.age, p.m.height, p.m.lying ?? p.age <= 24) : p.m.weight);
  const ys = [...pts.map(val)].concat(cs.flatMap((c) => c.pts.filter((p) => p.x >= lo && p.x <= hi).map((p) => p.y)));
  const yMin = Math.floor(Math.min(...ys) / (ind === "hfa" ? 5 : 2)) * (ind === "hfa" ? 5 : 2);
  const yMax = Math.ceil(Math.max(...ys) / (ind === "hfa" ? 5 : 2)) * (ind === "hfa" ? 5 : 2);
  const x = (m: number) => PAD.l + ((m - lo) / (hi - lo)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - ((v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const path = (c: (typeof cs)[number]) => c.pts.map((p, i) => `${i ? "L" : "M"}${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ");
  const band = (a: number, b: number) => {
    const A = cs.find((c) => c.z === a)!.pts;
    const B = cs.find((c) => c.z === b)!.pts;
    return "M" + A.map((p) => `${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join("L") + "L" + [...B].reverse().map((p) => `${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join("L") + "Z";
  };
  const step = ind === "hfa" ? (zoom ? 5 : 10) : zoom ? 2 : 4;
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax; v += step) ticks.push(v);
  const label: Record<number, string> = { [-3]: "-3", [-2]: "-2", 0: "median", 2: "+2", 3: "+3" };

  return (
    <div>
      <div className="mb-3 flex gap-2" role="tablist">
        {(
          [
            ["hfa", "Tinggi menurut umur"],
            ["wfa", "Berat menurut umur"],
          ] as const
        ).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={ind === k} onClick={() => setInd(k)} className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-bold ${ind === k ? "bg-leaf text-white" : "border border-line bg-white text-mute"}`}>
            {l}
          </button>
        ))}
      </div>
      <div ref={box} className="w-full min-w-0 overflow-hidden"><svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label={`Grafik pertumbuhan ${ind === "hfa" ? "tinggi" : "berat"} dibanding kurva standar WHO`}>
        <defs><clipPath id="plot"><rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} /></clipPath></defs>
        <g clipPath="url(#plot)"><path d={band(-2, 2)} fill="#E3F4E8" opacity="1" />
        <path d={band(-3, -2)} fill="#FDEBD8" opacity="0.9" />
        <path d={band(2, 3)} fill="#FEF3CD" opacity="0.9" /></g>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="#E3E8EF" strokeDasharray="3 4" />
            <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#5F6B7A">{v}</text>
          </g>
        ))}
        {(zoom ? Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((m) => (m - lo) % Math.max(1, Math.ceil((hi - lo) / (W < 400 ? 6 : 10))) === 0) : W < 400 ? [0, 12, 24, 36, 48, 60] : [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60]).map((m) => (
          <text key={m} x={x(m)} y={H - 12} textAnchor="middle" fontSize="11" fill="#5F6B7A">{m}</text>
        ))}
        {cs.map((c) => (
          <g key={c.z}>
            <path clipPath="url(#plot)" d={path(c)} fill="none" stroke={c.z === 0 ? "#1E8E3E" : Math.abs(c.z) === 3 ? "#D93025" : "#E8710A"} strokeWidth={c.z === 0 ? 2 : 1.4} strokeDasharray={c.z === 0 ? undefined : "5 4"} />
            <text x={W - PAD.r - 2} y={y(c.pts[hi].y) - 4} textAnchor="end" fontSize="10" fontWeight="700" fill="#5F6B7A">{label[c.z]}</text>
          </g>
        ))}
        {pts.length > 1 && <polyline points={pts.map((p) => `${x(p.age)},${y(val(p))}`).join(" ")} fill="none" stroke="#1F2937" strokeWidth="2.5" strokeLinejoin="round" />}
        {pts.map((p) => (
          <circle key={p.m.id} cx={x(p.age)} cy={y(val(p))} r={pts.length > 6 ? 3.5 : 4.5} fill="#1F2937" stroke="#FFFFFF" strokeWidth="1.5" />
        ))}
        {pts.length > 0 && (() => { const p = pts[pts.length - 1]; const px = x(p.age); const right = px > W - 70; return <text x={right ? px - 9 : px + 9} y={y(val(p)) + 4} textAnchor={right ? "end" : "start"} fontSize="12" fontWeight="700" fill="#1F2937">{val(p).toFixed(1)}</text>; })()}
      </svg></div>
      <p className="mt-1 text-xs text-mute">Pita hijau: rentang normal (-2 sampai +2 SD). Garis putus-putus: batas -3, -2, +2, +3 SD. Titik hitam: hasil pengukuran anak. Sumbu bawah: usia dalam bulan.{zoom ? " Tampilan diperbesar ke rentang usia kunjungan anak." : ""}</p>
      {ind === "wfa" && pts.length >= 2 && (
        <div className="mt-3">
          <div className="mb-1 text-xs font-bold text-mute">Bacaan KMS: N = berat naik dibanding penimbangan sebelumnya, T = tidak naik</div>
          <ol className="flex flex-wrap items-center gap-1" aria-label="Berat naik atau tidak naik dari kunjungan ke kunjungan">
            {pts.slice(1).map((p, i) => {
              const prev = pts[i];
              const up = p.m.weight > prev.m.weight;
              return (
                <li key={p.m.id}
                  aria-label={`${p.m.date}: ${up ? "naik" : "tidak naik"} dibanding ${prev.m.date}`}
                  title={`${p.m.date}: ${String(prev.m.weight).replace(".", ",")} → ${String(p.m.weight).replace(".", ",")} kg`}
                  className={`chip ${up ? "chip-ok" : "chip-severe"}`}>{up ? "N" : "T"}</li>
              );
            })}
          </ol>
          <p className="mt-1 text-xs text-mute">T dua kali berturut-turut berarti berat anak tidak naik 2 bulan: perlu perhatian dan konsultasi ke puskesmas.</p>
        </div>
      )}
    </div>
  );
}
