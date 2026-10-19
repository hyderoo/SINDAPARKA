"use client";
import { useEffect, useState } from "react";
import { actions, useStore } from "@/lib/store";
import type { AccountStatus, Profile, Role } from "@/lib/types";
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
        <div><label className="label">Peran</label><select className="field" value={role} disabled={me} onChange={(e) => setRole(e.target.value as Role)}><option value="kader">Kader</option><option value="nakes">Tenaga kesehatan</option><option value="admin">Admin</option></select></div>
        <div><label className="label">Posyandu</label><select className="field" value={pos} onChange={(e) => setPos(e.target.value)}><option value="">-</option>{s.posyanduList.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
        <div><label className="label">Status</label><select className="field" value={status} disabled={me} onChange={(e) => setStatus(e.target.value as AccountStatus)}><option value="pending">Menunggu</option><option value="active">Aktif</option><option value="disabled">Nonaktif</option></select></div>
      </div>
      <div className="flex items-center gap-3"><button className="btn btn-primary" onClick={save}>Simpan</button>{msg && <span className="text-sm font-semibold text-mute">{msg}</span>}</div>
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
      <section className="card space-y-3 p-5">
        <h2 className="font-display text-xl font-semibold">Puskesmas dan posyandu</h2>
        <p className="text-sm text-mute">Tambahkan dulu puskesmas, lalu posyandu di bawahnya. Gunakan nama resmi.</p>
        <div className="flex flex-wrap gap-2">
          <input className="field min-w-0 flex-1" placeholder="Nama puskesmas" value={pk} onChange={(e) => setPk(e.target.value)} />
          <button className="btn btn-ghost" disabled={pk.trim().length < 2} onClick={async () => { setNote((await actions.addPuskesmas(pk)) ?? "Puskesmas ditambahkan"); setPk(""); }}>Tambah puskesmas</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="field min-w-0 flex-1" value={pkId || s.puskesmasList[0]?.id || ""} onChange={(e) => setPkId(e.target.value)}>{s.puskesmasList.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <input className="field min-w-0 flex-1" placeholder="Nama posyandu" value={po} onChange={(e) => setPo(e.target.value)} />
          <button className="btn btn-ghost" disabled={po.trim().length < 2 || !s.puskesmasList.length} onClick={async () => { setNote((await actions.addPosyandu(po, pkId || s.puskesmasList[0].id)) ?? "Posyandu ditambahkan"); setPo(""); }}>Tambah posyandu</button>
        </div>
        {note && <p className="text-sm font-semibold text-mute">{note}</p>}
        {s.puskesmasList.map((x) => (
          <label key={x.id} className="flex min-h-11 items-start gap-3 rounded-xl border border-line bg-bg p-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={x.endemicVaccines} onChange={async (e) => setNote((await actions.setEndemicVaccines(x.id, e.target.checked)) ?? (e.target.checked ? "Imunisasi wilayah endemis ditampilkan" : "Imunisasi wilayah endemis disembunyikan"))} />
            <span><b>{x.name}</b>: tampilkan imunisasi khusus wilayah endemis (Japanese Encephalitis). Aktifkan hanya jika puskesmas memastikan wilayahnya termasuk.</span>
          </label>
        ))}
        <p className="text-sm text-mute">Terdaftar: {s.puskesmasList.length} puskesmas, {s.posyanduList.length} posyandu.</p>
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
