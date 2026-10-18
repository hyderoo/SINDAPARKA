import type { Status } from "@/lib/who";

export function StatusChip({ s }: { s: Status | null }) {
  if (!s) return <span className="chip chip-watch">Di luar tabel</span>;
  const dot = { ok: "●", watch: "◐", moderate: "▲", severe: "◆", high: "◆" }[s.level];
  return (
    <span className={`chip chip-${s.level}`}>
      <span aria-hidden>{dot}</span>
      {s.label}
    </span>
  );
}

export function zfmt(z: number | null) {
  if (z == null) return "-";
  return (z > 0 ? "+" : "") + z.toFixed(2).replace(".", ",");
}

/** Horizontal gauge for a z-score from -4 to +4, with the WHO bands behind it. */
export function ZGauge({ z, label }: { z: number | null; label: string }) {
  const pos = z == null ? 50 : Math.max(0, Math.min(100, ((z + 4) / 8) * 100));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-bold text-mute">{label}</span>
        <span className="font-display text-xl font-semibold tabular-nums">{zfmt(z)}</span>
      </div>
      <div className="relative h-3 rounded-full" style={{ background: "linear-gradient(90deg,#D93025 0%,#D93025 12.5%,#E8710A 12.5%,#E8710A 25%,#34A853 25%,#34A853 62.5%,#F9AB00 62.5%,#F9AB00 75%,#8E6BD6 75%)" }} aria-hidden>
        <div className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-white shadow" style={{ left: `${pos}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-semibold text-mute tabular-nums">
        <span>-3</span>
        <span>-2</span>
        <span>0</span>
        <span>+2</span>
        <span>+3</span>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card p-6 text-center text-mute">{children}</div>;
}
