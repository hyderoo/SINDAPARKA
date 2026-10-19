"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { actions, useStore } from "@/lib/store";
import type { AccountStatus, Posyandu, Profile, Role } from "@/lib/types";
import { Msg } from "@/components/Auth";

function Row({ p, onSaved }: { p: Profile; onSaved: () => void }) {
  const s = useStore()!;
  const [role, setRole] = useState<Role>(p.role);
  const [status, setStatus] = useState<AccountStatus>(p.status);
  const [pos, setPos] = useState(p.posyanduId ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const me = p.id === s.userId;
  const save = async () => {
    if (role === "kader" && status === "active" && !pos) { setMsg("Pilih posyandu untuk kader."); return; }
    const puskesmasId = s.posyanduList.find((x) => x.id === pos)?.puskesmasId ?? p.puskesmasId ?? s.puskesmasList[0]?.id ?? null;
    const e = await actions.updateProfile(p.id, { role, status, posyanduId: pos || null, puskesmasId });
    setMsg(e ?? "Tersimpan");
    if (!e) onSaved();
  };
  return (
    <li className="card grid gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <b>{p.fullName || "(tanpa nama)"}{me && " (Anda)"}</b>
        <span className={`chip ${p.status === "active" ? "chip-ok" : p.status === "pending" ? "chip-watch" : "chip-severe"}`}>{p.status}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className="label">Peran</label><select className="field" aria-label={`Peran untuk ${p.fullName || "pengguna"}`} value={role} disabled={me} onChange={(e) => setRole(e.target.value as Role)}><option value="kader">Kader</option><option value="nakes">Tenaga kesehatan</option><option value="admin">Admin</option></select></div>
        <div><label className="label">Posyandu</label><select className="field" aria-label={`Posyandu untuk ${p.fullName || "pengguna"}`} value={pos} onChange={(e) => setPos(e.target.value)}><option value="">-</option>{s.posyanduList.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
        <div><label className="label">Status</label><select className="field" aria-label={`Status untuk ${p.fullName || "pengguna"}`} value={status} disabled={me} onChange={(e) => setStatus(e.target.value as AccountStatus)}><option value="pending">Menunggu</option><option value="active">Aktif</option><option value="disabled">Nonaktif</option></select></div>
      </div>
      <div className="flex items-center gap-3"><button className="btn btn-primary" onClick={save}>Simpan</button>{msg && <span className="text-sm font-semibold text-mute">{msg}</span>}</div>
    </li>
  );
}


const PARAKAN_KAUMAN = `Candrarini 1 | Tejosari/I
Candrarini 2 | Sidorejo/II
Candrarini 3 | Jetis Lor/III
Candrarini 4 | Jetis Kidul/IV
Candrarini 5 | Karangsari/V
Candrarini 6 | Karangsari/VI
Candrarini 7 | Besaran/VII
Candrarini 89 | Jogomertan/VIII dan IX
Candrarini 10 | Klewogan/X
Candrarini 11 | Karangtengah/XI
Candrarini 12 | Jetis Kauman/XII
Candrarini 13 | Coyudan Selatan/XIII
Candrarini 14 | Coyudan Utara/XIV
Candrarini 15 | Sekrikil/XV
Candrarini 16 | Situk/XVI`;

function BulkAdd({ pkId }: { pkId: string }) {
  const [txt, setTxt] = useState("");
  const [m, setM] = useState<string | null>(null);
  const items = txt.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [n, d] = l.split("|"); return { name: n.trim(), dusun: (d ?? "").trim() }; });
  return (
    <div className="space-y-2 rounded-xl border border-line bg-bg p-3">
      <label className="font-bold" htmlFor="bulk">Tambah banyak posyandu sekaligus</label>
      <p className="text-sm text-mute">Satu baris satu posyandu: Nama | Dusun/RW. Puskesmas mengikuti pilihan di atas. Koordinat diisi terpisah di bawah.</p>
      <textarea id="bulk" rows={8} className="field !h-auto w-full" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={"Nama posyandu | Dusun/RW"} />
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-ghost" onClick={() => setTxt(PARAKAN_KAUMAN)}>Isi daftar Desa Parakan Kauman (15)</button>
        <button className="btn btn-ghost" disabled={!pkId || items.length === 0 || items.some((i) => i.name.length < 2)} onClick={async () => { if (!confirm(`Tambahkan ${items.length} posyandu?`)) return; setM((await actions.addPosyanduBulk(pkId, items)) ?? `${items.length} posyandu ditambahkan`); setTxt(""); }}>Tambahkan {items.length || ""}</button>
      </div>
      <p className="text-xs text-mute">Daftar Desa Parakan Kauman berasal dari data desa tahun 2022 yang diberikan tim. Periksa sebelum menyimpan. Jangan klik dua kali agar tidak terduplikat.</p>
      {m && <p className="text-sm font-semibold text-mute" role="status">{m}</p>}
    </div>
  );
}

function LocRow({ p }: { p: Posyandu }) {
  const [lat, setLat] = useState(p.lat?.toString() ?? "");
  const [lng, setLng] = useState(p.lng?.toString() ?? "");
  const [dusun, setDusun] = useState(p.dusun ?? "");
  const [m, setM] = useState<string | null>(null);
  const n = (v: string) => Number(v.replace(",", "."));
  const empty = lat.trim() === "" && lng.trim() === "";
  const ok = empty || (Number.isFinite(n(lat)) && Number.isFinite(n(lng)) && lat.trim() !== "" && lng.trim() !== "");
  return (
    <li className="space-y-2 rounded-xl border border-line bg-bg p-3">
      <div className="font-bold">{p.name}</div>
      <div className="grid gap-2 sm:grid-cols-3">
        <input className="field min-w-0" aria-label={`Dusun atau RW, ${p.name}`} placeholder="Dusun / RW" value={dusun} onChange={(e) => setDusun(e.target.value)} />
        <input className="field min-w-0" inputMode="decimal" aria-label={`Lintang, ${p.name}`} placeholder="Lintang (contoh -7.2864)" value={lat} onChange={(e) => setLat(e.target.value)} />
        <input className="field min-w-0" inputMode="decimal" aria-label={`Bujur, ${p.name}`} placeholder="Bujur (contoh 110.0957)" value={lng} onChange={(e) => setLng(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost" disabled={!ok} onClick={async () => setM((await actions.setPosyanduLocation(p.id, { lat: empty ? null : n(lat), lng: empty ? null : n(lng), dusun })) ?? "Tersimpan")}>Simpan lokasi</button>
        <span className="text-sm text-mute" role="status">{ok ? m : "Isi lintang dan bujur sebagai angka"}</span>
      </div>
    </li>
  );
}

export default function Admin() {
  const s = useStore();
  const [list, setList] = useState<Profile[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pk, setPk] = useState("");
  const [po, setPo] = useState("");
  const [pkId, setPkId] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [demoMsg, setDemoMsg] = useState<string | null>(null);
  useEffect(() => { if (s?.role === "admin") actions.hasDemo().then(setDemo); }, [s?.role]);
  const load = () => actions.listProfiles().then(setList).catch((e) => setErr(String(e.message ?? e)));
  useEffect(() => { if (s?.role === "admin") load(); }, [s?.role]);
  if (!s) return null;
  if (s.role !== "admin") return <Msg kind="err">Halaman ini hanya untuk admin.</Msg>;
  const pending = (list ?? []).filter((p) => p.status === "pending");
  const rest = (list ?? []).filter((p) => p.status !== "pending");
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Admin</h1>
      <Link href="/admin/audit" className="card flex min-h-14 items-center justify-between p-4 font-bold">
        <span>Catatan perubahan data (audit)</span>
        <span className="text-mute" aria-hidden>&rarr;</span>
      </Link>
      <section className="card space-y-3 p-5">
        <h2 className="font-display text-xl font-semibold">Puskesmas dan posyandu</h2>
        <p className="text-sm text-mute">Tambahkan dulu puskesmas, lalu posyandu di bawahnya. Gunakan nama resmi.</p>
        <div className="flex flex-wrap gap-2">
          <input className="field min-w-[10rem] flex-1" aria-label="Nama puskesmas baru" placeholder="Nama puskesmas" value={pk} onChange={(e) => setPk(e.target.value)} />
          <button className="btn btn-ghost" disabled={pk.trim().length < 2} onClick={async () => { setNote((await actions.addPuskesmas(pk)) ?? "Puskesmas ditambahkan"); setPk(""); }}>Tambah puskesmas</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="field min-w-[10rem] flex-1" aria-label="Pilih puskesmas untuk posyandu baru" value={pkId || s.puskesmasList[0]?.id || ""} onChange={(e) => setPkId(e.target.value)}>{s.puskesmasList.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <input className="field min-w-[10rem] flex-1" aria-label="Nama posyandu baru" placeholder="Nama posyandu" value={po} onChange={(e) => setPo(e.target.value)} />
          <button className="btn btn-ghost" disabled={po.trim().length < 2 || !s.puskesmasList.length} onClick={async () => { setNote((await actions.addPosyandu(po, pkId || s.puskesmasList[0].id)) ?? "Posyandu ditambahkan"); setPo(""); }}>Tambah posyandu</button>
        </div>
        <BulkAdd pkId={pkId || s.puskesmasList[0]?.id || ""} />
        {note && <p className="text-sm font-semibold text-mute">{note}</p>}
        {s.puskesmasList.map((x) => (
          <label key={x.id} className="flex min-h-11 items-start gap-3 rounded-xl border border-line bg-bg p-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={x.endemicVaccines} onChange={async (e) => setNote((await actions.setEndemicVaccines(x.id, e.target.checked)) ?? (e.target.checked ? "Imunisasi wilayah endemis ditampilkan" : "Imunisasi wilayah endemis disembunyikan"))} />
            <span><b>{x.name}</b>: tampilkan imunisasi khusus wilayah endemis (Japanese Encephalitis). Aktifkan hanya jika puskesmas memastikan wilayahnya termasuk.</span>
          </label>
        ))}
        <p className="text-sm text-mute">Terdaftar: {s.puskesmasList.length} puskesmas, {s.posyanduList.length} posyandu.</p>
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="font-display text-xl font-semibold">Lokasi posyandu</h2>
        <p className="text-sm text-mute">Untuk peta. Isi koordinat dari Google Maps atau OpenStreetMap (tekan lama pada titik, salin angka lintang dan bujur). Hanya lokasi posyandu, bukan alamat anak.</p>
        <ul className="grid gap-3">{s.posyanduList.map((p) => <LocRow key={p.id + (p.lat ?? "") + (p.lng ?? "")} p={p} />)}</ul>
      </section>
      {(demo || demoMsg) && (
        <section className="card space-y-3 border-2 border-sun p-5">
          <h2 className="font-display text-xl font-semibold">Data uji coba</h2>
          {demo ? (
            <>
              <p className="text-sm text-mute">Aplikasi masih berisi anak fiktif untuk uji coba. Hapus sebelum data anak yang sebenarnya dimasukkan. Yang dihapus: semua anak, pengukuran, imunisasi, dan puskesmas atau posyandu uji coba beserta catatan perubahannya. Akun pengguna tidak ikut dihapus. Tidak bisa dibatalkan.</p>
              <button className="btn btn-ghost !border-berry text-berry" onClick={async () => { if (!confirm("Hapus semua data uji coba? Tindakan ini tidak bisa dibatalkan.")) return; setDemoMsg(await actions.deleteDemo()); setDemo(await actions.hasDemo()); }}>Hapus data uji coba</button>
            </>
          ) : null}
          {demoMsg && <p className="text-sm font-semibold text-mute" role="status">{demoMsg}</p>}
        </section>
      )}
      {err && <Msg kind="err">{err}</Msg>}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Menunggu persetujuan ({pending.length})</h2>
        {pending.length === 0 && <p className="text-mute">Tidak ada pendaftar baru.</p>}
        <ul className="grid gap-3">{pending.map((p) => <Row key={p.id} p={p} onSaved={load} />)}</ul>
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Pengguna lain</h2>
        <ul className="grid gap-3">{rest.map((p) => <Row key={p.id} p={p} onSaved={load} />)}</ul>
      </section>
    </div>
  );
}
