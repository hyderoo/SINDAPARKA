"use client";
import Link from "next/link";
import { useScope } from "@/lib/scope";
import { optsFor, remindersFor } from "@/lib/schedule";
import { actions } from "@/lib/store";
import { useState } from "react";
import type { Posyandu } from "@/lib/types";
import { fmtDate, todayISO } from "@/lib/age";

function nextDate(day: number, today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const clamp = (yy: number, mm: number) => Math.min(day, new Date(yy, mm, 0).getDate());
  if (clamp(y, m) >= d) return `${y}-${String(m).padStart(2, "0")}-${String(clamp(y, m)).padStart(2, "0")}`;
  const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-${String(clamp(ny, nm)).padStart(2, "0")}`;
}

function PosyanduDay({ p, today }: { p: Posyandu; today: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const id = `hari-${p.id}`;
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3">
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{p.name}</div>
        <div className="text-sm text-mute" role="status">{msg ?? (p.visitDay ? `Berikutnya: ${fmtDate(nextDate(p.visitDay, today))}` : "Tanggal posyandu belum diatur")}</div>
      </div>
      <label htmlFor={id} className="sr-only">Tanggal posyandu tiap bulan, {p.name}</label>
      <select id={id} className="field !min-h-11 !w-auto" value={p.visitDay ?? ""} onChange={async (e) => { const v = e.target.value ? Number(e.target.value) : null; setMsg((await actions.setPosyanduDay(p.id, v)) ?? "Tersimpan"); }}>
        <option value="">Belum diatur</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Tanggal {d}</option>)}
      </select>
    </li>
  );
}

export default function Jadwal() {
  const sc = useScope();
  if (!sc) return null;
  const today = todayISO();
  const all = sc.children
    .flatMap((c) => remindersFor(c, sc.measurements.filter((m) => m.childId === c.id), today, optsFor(sc.s, c)).map((r) => ({ ...r, child: c })))
    .filter((r) => r.daysLeft <= 14)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const groups = [
    { t: "Terlambat", items: all.filter((r) => r.daysLeft < 0), tone: "chip-severe" },
    { t: "Minggu ini", items: all.filter((r) => r.daysLeft >= 0 && r.daysLeft <= 7), tone: "chip-watch" },
    { t: "Dua minggu ke depan", items: all.filter((r) => r.daysLeft > 7), tone: "chip-ok" },
  ];
  const wa = (name: string, title: string, due: string) => `https://wa.me/?text=${encodeURIComponent(`Selamat pagi Bu, mengingatkan jadwal ${title} untuk ${name} pada ${fmtDate(due)} di posyandu. Terima kasih.`)}`;
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-semibold">Pengingat jadwal</h1>
      <section aria-labelledby="hari-posyandu">
        <h2 id="hari-posyandu" className="mb-2 font-display text-xl font-semibold">Hari posyandu</h2>
        <ul className="grid gap-2 md:grid-cols-2">
          {sc.s.posyanduList.filter((p) => sc.s.role !== "kader" || p.id === sc.s.posyanduId).map((p) => <PosyanduDay key={p.id + (p.visitDay ?? "")} p={p} today={today} />)}
        </ul>
        <p className="mt-1 text-xs text-mute">Tanggal tetap setiap bulan. Pengingat penimbangan bulanan mengikuti tanggal ini.</p>
      </section>
      <p className="text-sm text-mute">Kunjungan bulanan jatuh pada tanggal posyandu bulan berikutnya (atau 1 bulan setelah penimbangan terakhir jika tanggal belum diatur). Imunisasi yang sudah dicatat tidak muncul lagi. Tombol pesan membuka WhatsApp dengan teks siap kirim; kader yang memilih nomor dan mengirimnya.</p>
      {groups.map((g) => (
        <section key={g.t}>
          <h2 className="mb-2 font-display text-xl font-semibold">{g.t} <span className="text-sm text-mute">({g.items.length})</span></h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {g.items.map((r) => (
              <li key={r.childId + r.kind} className="card flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/anak/${r.childId}`} className="flex min-h-11 items-center truncate font-bold">{r.child.name}</Link>
                  <div className="text-sm text-mute">{r.title}</div>
                  <span className={`chip mt-1 ${g.tone}`}>{fmtDate(r.due)}</span>
                </div>
                <a className="btn btn-ghost !min-h-11 !px-3 text-sm" href={wa(r.child.name, r.title, r.due)} target="_blank" rel="noreferrer">Pesan</a>
              </li>
            ))}
          </ul>
          {g.items.length === 0 && <p className="rounded-xl bg-white p-3 text-sm text-mute">Tidak ada yang masuk kategori ini.</p>}
        </section>
      ))}
    </div>
  );
}
