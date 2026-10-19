"use client";
import Link from "next/link";
import { useScope } from "@/lib/scope";
import { remindersFor } from "@/lib/schedule";
import { fmtDate, todayISO } from "@/lib/age";

export default function Jadwal() {
  const sc = useScope();
  if (!sc) return null;
  const today = todayISO();
  const all = sc.children
    .flatMap((c) => remindersFor(c, sc.measurements.filter((m) => m.childId === c.id), today).map((r) => ({ ...r, child: c })))
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
      <p className="text-sm text-mute">Kunjungan bulanan dihitung 1 bulan dari penimbangan terakhir. Tombol pesan membuka WhatsApp dengan teks siap kirim; kader yang memilih nomor dan mengirimnya.</p>
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
