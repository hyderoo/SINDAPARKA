"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useScope } from "@/lib/scope";
import { rows, prevalence } from "@/lib/analytics";
import { fmtDate, todayISO } from "@/lib/age";

const MIN_N = 10;
// Prevalence bands follow the WHO/Kemenkes public health significance convention for stunting.
function band(n: number, pct: number) {
  if (n < MIN_N) return { c: "#8a8f98", t: "Data belum cukup" };
  if (pct < 10) return { c: "#2f7d4f", t: "Rendah (<10%)" };
  if (pct < 20) return { c: "#c99a1c", t: "Sedang (10 sampai <20%)" };
  if (pct < 30) return { c: "#d9772b", t: "Tinggi (20 sampai <30%)" };
  return { c: "#b3402f", t: "Sangat tinggi (30% atau lebih)" };
}
function nextDay(day: number, today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const clamp = (yy: number, mm: number) => Math.min(day, new Date(yy, mm, 0).getDate());
  if (clamp(y, m) >= d) return `${y}-${String(m).padStart(2, "0")}-${String(clamp(y, m)).padStart(2, "0")}`;
  const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-${String(clamp(ny, nm)).padStart(2, "0")}`;
}

export default function Peta() {
  const sc = useScope();
  const box = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const today = todayISO();

  const stats = useMemo(() => {
    if (!sc) return [];
    const all = rows(sc.children, sc.measurements);
    return sc.s.posyanduList.map((p) => {
      const mine = sc.s.role === "kader" && p.id !== sc.s.posyanduId ? null : all.filter((r) => r.child.posyanduId === p.id);
      const pv = mine ? prevalence(mine) : null;
      return { p, visible: !!mine, children: mine?.length ?? 0, n: pv?.n ?? 0, pct: pv?.pct ?? 0 };
    });
  }, [sc]);
  const placed = stats.filter((x) => x.p.lat != null && x.p.lng != null);

  useEffect(() => {
    if (!box.current || !sc || placed.length === 0) return;
    let map: import("maplibre-gl").Map | null = null;
    let dead = false;
    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (dead || !box.current) return;
        map = new ml.Map({
          container: box.current,
          style: { version: 8, sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19, attribution: "© OpenStreetMap contributors" } }, layers: [{ id: "osm", type: "raster", source: "osm" }] },
          center: [placed[0].p.lng!, placed[0].p.lat!], zoom: 13, attributionControl: { compact: true },
        });
        map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
        const b = new ml.LngLatBounds();
        placed.forEach((x) => {
          const el = document.createElement("button");
          el.type = "button";
          const bd = x.visible ? band(x.n, x.pct) : { c: "#8a8f98", t: "" };
          el.style.cssText = "width:44px;height:44px;display:flex;align-items:flex-end;justify-content:center;background:none;border:0;padding:0;cursor:pointer";
          const pin = document.createElement("span");
          pin.style.cssText = `width:30px;height:30px;margin-bottom:6px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${bd.c};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)`;
          el.appendChild(pin);
          el.addEventListener("click", () => setSel(x.p.id));
          new ml.Marker({ element: el, anchor: "bottom" }).setLngLat([x.p.lng!, x.p.lat!]).addTo(map!);
          el.setAttribute("aria-label", `Posyandu ${x.p.name}`);
          b.extend([x.p.lng!, x.p.lat!]);
        });
        if (placed.length > 1) map.fitBounds(b, { padding: 50, maxZoom: 16, duration: 0 });
      } catch { setFailed(true); }
    })();
    return () => { dead = true; map?.remove(); };
  }, [sc, placed.map((x) => `${x.p.id}${x.n}${x.pct}${x.p.lat}${x.p.lng}`).join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!sc) return null;
  const cur = stats.find((x) => x.p.id === sel);
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold">Peta posyandu</h1>
      <p className="text-sm text-mute">Hanya jumlah dan persentase per posyandu. Nama anak dan alamat tidak ditampilkan. {sc.s.role === "kader" ? "Statistik hanya untuk posyandu Anda." : ""}</p>
      {placed.length === 0 ? (
        <div className="card p-5">
          <p className="font-semibold">Lokasi posyandu belum diisi.</p>
          <p className="mt-1 text-sm text-mute">{sc.s.role === "admin" ? <>Isi koordinat di <Link className="underline" href="/admin">halaman Admin</Link>, bagian Lokasi posyandu.</> : "Minta admin mengisi lokasi posyandu."}</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="card overflow-hidden p-0">
            <div ref={box} className="h-[55vh] min-h-[320px] w-full" role="application" aria-label="Peta lokasi posyandu" />
            {failed && <p className="p-3 text-sm text-berry">Peta tidak bisa dimuat. Daftar di samping tetap bisa dipakai.</p>}
          </div>
          <div className="space-y-3">
            {cur ? (
              <div className="card space-y-1 p-4" role="status">
                <div className="font-display text-xl font-semibold">{cur.p.name}</div>
                {cur.p.dusun && <div className="text-sm text-mute">{cur.p.dusun}</div>}
                {cur.visible ? (
                  <>
                    <div>Anak dipantau: <b>{cur.children}</b></div>
                    <div>Anak pendek: <b>{cur.n < MIN_N ? "belum ditampilkan (kurang dari 10 anak terukur)" : `${cur.pct.toFixed(0)}% dari ${cur.n} anak terukur`}</b></div>
                  </>
                ) : <div className="text-sm text-mute">Statistik hanya untuk anggota posyandu ini.</div>}
                <div>Hari posyandu: <b>{cur.p.visitDay ? `berikutnya ${fmtDate(nextDay(cur.p.visitDay, today))}` : "belum diatur"}</b></div>
              </div>
            ) : <p className="card p-4 text-sm text-mute">Ketuk penanda di peta untuk melihat ringkasan.</p>}
            <div className="card p-4 text-sm">
              <div className="mb-2 font-bold">Warna penanda: persentase anak pendek</div>
              {["#2f7d4f|Rendah (<10%)", "#c99a1c|Sedang (10 sampai <20%)", "#d9772b|Tinggi (20 sampai <30%)", "#b3402f|Sangat tinggi (30% atau lebih)", "#8a8f98|Data belum cukup (kurang dari 10 anak terukur)"].map((l) => { const [c, t] = l.split("|"); return <div key={c} className="flex items-center gap-2 py-0.5"><span className="inline-block h-3 w-3 rounded-full" style={{ background: c }} /> {t}</div>; })}
            </div>
            <ul className="space-y-1">
              {placed.map((x) => <li key={x.p.id}><button className="flex min-h-11 w-full items-center gap-2 rounded-xl bg-white px-3 text-left font-semibold" onClick={() => setSel(x.p.id)}><span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: x.visible ? band(x.n, x.pct).c : "#8a8f98" }} /> <span className="truncate">{x.p.name}</span></button></li>)}
            </ul>
          </div>
        </div>
      )}
      <p className="text-xs text-mute">Peta dasar: © OpenStreetMap contributors. Tidak ada pelacakan lokasi pengguna.</p>
    </div>
  );
}
