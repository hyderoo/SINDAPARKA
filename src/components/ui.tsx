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

const ICONS = {
  child: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7",
  check: "M5 12.5l4.5 4.5L19 7.5",
  calendar: "M4 7h16v13H4zM4 11h16M8 3v4M16 3v4",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4",
};

/** Friendly empty state: icon, one clear sentence, and one next action. */
export function EmptyState({ icon = "child", title, text, children, compact }: { icon?: keyof typeof ICONS; title: string; text?: string; children?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "py-4" : "card p-6 py-8"}`}>
      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-leaf-soft text-leaf" aria-hidden>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[icon]} /></svg>
      </span>
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-mute">{text}</p>}
      {children && <div className="mt-4 flex w-full max-w-xs flex-col gap-2">{children}</div>}
    </div>
  );
}
