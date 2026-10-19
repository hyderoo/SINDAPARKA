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
// Short pin code like a transit line label: Roman numeral from the dusun ("Tejosari/I" -> "I"),
// else the trailing number from the name, else initials.
function pinCode(name: string, dusun: string | null): string {
  if (dusun) {
    const m = dusun.match(/\/\s*([IVXLCDM]+)/i);
    if (m) return m[1].toUpperCase();
  }
  const n = name.match(/(\d+)\s*$/);
  if (n) return n[1];
  return name.replace(/^(posyandu|candrarini)\s+/i, "").slice(0, 3).toUpperCase();
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
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const pinEls = useRef(new Map<string, HTMLButtonElement>());
  const pinPts = useRef(new Map<string, [number, number]>());
  const listEls = useRef(new Map<string, HTMLLIElement>());
  const [sel, setSel] = useState<string | null>(null);
  const [labelsOn, setLabelsOn] = useState(false);
  const [pinVersion, setPinVersion] = useState(0);
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
    const els = pinEls.current;
    const pts = pinPts.current;
    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (dead || !box.current) return;
        map = new ml.Map({
          container: box.current,
          style: { version: 8, sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 19, attribution: "© OpenStreetMap contributors" } }, layers: [{ id: "osm", type: "raster", source: "osm" }] },
          center: [placed[0].p.lng!, placed[0].p.lat!], zoom: 13, attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
        map.on("zoom", () => setLabelsOn((map?.getZoom() ?? 0) >= 15));
        const b = new ml.LngLatBounds();
        placed.forEach((x) => {
          const bd = x.visible ? band(x.n, x.pct) : { c: "#8a8f98", t: "" };
          const el = document.createElement("button");
          el.type = "button";
          el.className = "map-pin";
          el.style.setProperty("--pin-c", bd.c);
          el.setAttribute("aria-label", `Posyandu ${x.p.name}`);
          const head = document.createElement("span");
          head.className = "pin-head";
          const code = document.createElement("span");
          code.className = "pin-code";
          code.textContent = pinCode(x.p.name, x.p.dusun);
          head.appendChild(code);
          const label = document.createElement("span");
          label.className = "pin-label";
          label.textContent = x.p.name;
          el.append(head, label);
          el.addEventListener("click", () => setSel((cur) => (cur === x.p.id ? null : x.p.id)));
          new ml.Marker({ element: el, anchor: "bottom" }).setLngLat([x.p.lng!, x.p.lat!]).addTo(map!);
          els.set(x.p.id, el);
          pts.set(x.p.id, [x.p.lng!, x.p.lat!]);
          b.extend([x.p.lng!, x.p.lat!]);
        });
        if (placed.length > 1) map.fitBounds(b, { padding: 60, maxZoom: 16, duration: 0 });
        setPinVersion((v) => v + 1);
      } catch { setFailed(true); }
    })();
    return () => { dead = true; els.clear(); pts.clear(); mapRef.current = null; map?.remove(); };
  }, [sc, placed.map((x) => `${x.p.id}${x.n}${x.pct}${x.p.lat}${x.p.lng}`).join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  // pin selection + label visibility styling
  useEffect(() => {
    pinEls.current.forEach((el, id) => {
      el.classList.toggle("is-sel", sel === id);
      el.classList.toggle("show-label", labelsOn);
    });
  }, [sel, labelsOn, pinVersion]);

  // list -> map sync: scroll the selected row into view
  useEffect(() => {
    if (sel) listEls.current.get(sel)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [sel]);

  // list row click: select and fly the map to its pin
  function focusPosyandu(id: string) {
    setSel((cur) => (cur === id ? null : id));
    const pt = pinPts.current.get(id);
    const map = mapRef.current;
    if (pt && map) map.flyTo({ center: pt, zoom: Math.max(map.getZoom(), 15), duration: 600 });
  }

  if (!sc) return null;
  const cur = stats.find((x) => x.p.id === sel);
  const curBand = cur && cur.visible ? band(cur.n, cur.pct) : null;
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
                {curBand && (
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: `${curBand.c}1A`, color: curBand.c }}>
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: curBand.c }} />
                      {curBand.t}
                    </span>
                  </div>
                )}
                {cur.p.isDemo && <div className="rounded-lg bg-sun-soft px-2 py-1 text-xs font-semibold text-[#7A5B00]">Pin contoh (perkiraan), bukan lokasi asli.</div>}
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
              {placed.map((x) => {
                const bd = x.visible ? band(x.n, x.pct) : { c: "#8a8f98", t: "" };
                return (
                  <li key={x.p.id} ref={(el) => { if (el) listEls.current.set(x.p.id, el); else listEls.current.delete(x.p.id); }}>
                    <button
                      className={`flex min-h-11 w-full items-center gap-2 rounded-xl bg-white px-3 text-left ${sel === x.p.id ? "ring-2 ring-teal-600 bg-teal-50" : ""}`}
                      onClick={() => focusPosyandu(x.p.id)}
                    >
                      <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg px-1 text-[11px] font-extrabold text-white shadow-sm" style={{ background: bd.c }}>
                        {pinCode(x.p.name, x.p.dusun)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{x.p.name}</span>
                        <span className="block text-xs font-normal text-mute">{x.visible ? `${x.children} anak dipantau` : (x.p.dusun ?? "")}</span>
                      </span>
                      <span className="ml-auto text-sm font-bold" style={{ color: bd.c }}>{x.visible && x.n >= MIN_N ? `${x.pct.toFixed(0)}%` : "—"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
      <p className="text-xs text-mute">Peta dasar: © OpenStreetMap contributors. Tidak ada pelacakan lokasi pengguna.</p>
    </div>
  );
}
