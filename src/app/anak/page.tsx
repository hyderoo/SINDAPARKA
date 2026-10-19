"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useScope } from "@/lib/scope";
import { priority } from "@/lib/analytics";
import { StatusChip } from "@/components/ui";
import { fmtAge, fmtDate, todayISO, ageInMonths } from "@/lib/age";

type F = "all" | "stunted" | "falling" | "ok";
export default function Anak() {
  const sc = useScope();
  const [q, setQ] = useState("");
  const [f, setF] = useState<F>("all");
  const [pos, setPos] = useState("all");
  const list = useMemo(() => {
    if (!sc) return [];
    return sc.rows
      .filter((r) => r.child.name.toLowerCase().includes(q.toLowerCase()))
      .filter((r) => pos === "all" || r.child.posyandu === pos)
      .filter((r) => (f === "all" ? true : f === "stunted" ? r.last?.a.stunted : f === "falling" ? r.trend === "falling" : r.last && !r.last.a.stunted && r.trend !== "falling"))
      .sort((a, b) => priority(b) - priority(a) || a.child.name.localeCompare(b.child.name));
  }, [sc, q, f, pos]);
  if (!sc) return null;
  const today = todayISO();
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Data anak</h1>
        <span className="text-sm font-bold text-mute">{list.length} anak</span>
      </div>
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <input className="field" placeholder="Cari nama anak" aria-label="Cari nama anak" value={q} onChange={(e) => setQ(e.target.value)} />
        {sc.s.role !== "kader" && (
          <select className="field md:w-52" aria-label="Posyandu" value={pos} onChange={(e) => setPos(e.target.value)}>
            <option value="all">Semua posyandu</option>
            {sc.s.posyanduList.map((p) => <option key={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {([["all", "Semua"], ["stunted", "Pendek"], ["falling", "Kurva turun"], ["ok", "Normal"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setF(k)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${f === k ? "bg-ink text-white" : "border border-line bg-white text-mute"}`}>{l}</button>
        ))}
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((r) => (
          <li key={r.child.id}>
            <Link href={`/anak/${r.child.id}`} className="card flex min-h-[84px] items-center gap-3 p-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold ${r.child.sex === "L" ? "bg-leaf-soft text-leaf-deep" : "bg-clay-soft text-[#9A4A06]"}`}>{r.child.name[0]}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{r.child.name}</div>
                <div className="text-xs text-mute">{fmtAge(ageInMonths(r.child.birth, today))} · {r.child.posyandu} · terakhir {r.last ? fmtDate(r.last.m.date) : "-"}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.last && <StatusChip s={r.last.a.sHfa} />}
                  {r.trend === "falling" && <span className="chip chip-watch">↘</span>}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="card p-6 text-center text-mute">Tidak ada anak yang cocok dengan filter ini.</p>}
    </div>
  );
}
