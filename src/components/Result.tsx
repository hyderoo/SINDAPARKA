import { type Assessment } from "@/lib/who";
import { adviceFor } from "@/lib/advice";
import type { Trend } from "@/lib/analytics";
import { StatusChip, ZGauge } from "./ui";

export function Result({ a, age, trend }: { a: Assessment; age: number; trend?: Trend }) {
  const adv = adviceFor(a, age, trend);
  const bg = adv.tone === "act" ? "bg-clay-soft" : adv.tone === "watch" ? "bg-sun-soft" : "bg-ok-soft";
  return (
    <div className="space-y-4">
      <div className={`rounded-2xl p-4 ${bg}`}>
        <div className="font-display text-xl font-semibold leading-snug">{adv.headline}</div>
        {adv.referral && <div className="mt-2 inline-block rounded-lg bg-berry px-2 py-1 text-xs font-bold text-white">Disarankan rujuk ke puskesmas</div>}
      </div>
      <div className="grid gap-4">
        <div><ZGauge z={a.hfa} label="Panjang/tinggi menurut umur (PB/U atau TB/U)" /><div className="mt-2"><StatusChip s={a.sHfa} /></div></div>
        <div><ZGauge z={a.wfa} label="Berat menurut umur (BB/U)" /><div className="mt-2"><StatusChip s={a.sWfa} /></div></div>
        <div><ZGauge z={a.wfh} label="Berat menurut panjang/tinggi (BB/PB atau BB/TB)" /><div className="mt-2"><StatusChip s={a.sWfh} /></div></div>
        <div><ZGauge z={a.bfa} label="Indeks massa tubuh menurut umur (IMT/U)" /><div className="mt-2"><StatusChip s={a.sBfa} /></div></div>
      </div>
      <div>
        <div className="mb-2 text-sm font-bold text-mute">Yang bisa disampaikan ke orang tua</div>
        <ul className="space-y-2">
          {adv.bullets.map((b) => (
            <li key={b} className="flex gap-2 text-[15px]"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-leaf" />{b}</li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-mute">Hasil skrining untuk membantu kader. Bukan diagnosis medis; keputusan akhir ada pada tenaga kesehatan.</p>
    </div>
  );
}
