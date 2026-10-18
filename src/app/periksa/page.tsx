"use client";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useScope } from "@/lib/scope";
import { actions } from "@/lib/store";
import { POSYANDU } from "@/lib/seed";
import { ageInMonths, fmtAge, todayISO } from "@/lib/age";
import { assess, plausible, type Sex } from "@/lib/who";
import { Result } from "@/components/Result";

function Form() {
  const sc = useScope();
  const router = useRouter();
  const qp = useSearchParams();
  const [childId, setChildId] = useState(qp.get("anak") ?? "");
  const [isNew, setIsNew] = useState(false);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [sex, setSex] = useState<Sex>("L");
  const [birth, setBirth] = useState("");
  const [guardian, setGuardian] = useState("");
  const [date, setDate] = useState(todayISO());
  const [w, setW] = useState("");
  const [h, setH] = useState("");
  const [saved, setSaved] = useState(false);

  const child = sc?.children.find((c) => c.id === childId);
  const eSex = isNew ? sex : child?.sex;
  const eBirth = isNew ? birth : child?.birth;
  const age = eBirth ? ageInMonths(eBirth, date) : null;
  const wn = parseFloat(w.replace(",", "."));
  const hn = parseFloat(h.replace(",", "."));
  const numsOk = Number.isFinite(wn) && Number.isFinite(hn);
  const warn = age != null && numsOk ? plausible(age, wn, hn) : null;
  const a = useMemo(() => (eSex && age != null && numsOk && !warn ? assess(eSex, age, wn, hn) : null), [eSex, age, numsOk, warn, wn, hn]);
  const matches = useMemo(() => (sc ? sc.children.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : []), [sc, q]);
  if (!sc) return null;

  const canSave = !!a && (isNew ? name.trim().length > 1 && birth && birth <= date : !!child);
  const save = () => {
    if (!a) return;
    let id = childId;
    if (isNew) id = actions.addChild({ name: name.trim(), sex, birth, posyandu: sc.s.role === "kader" ? sc.s.posyandu : POSYANDU[0], guardian: guardian.trim() || "-" }).id;
    actions.addMeasurement({ childId: id, date, weight: wn, height: hn });
    setSaved(true);
    setTimeout(() => router.push(`/anak/${id}`), 700);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="card space-y-4 p-5">
        <h2 className="font-display text-xl font-semibold">1. Siapa anaknya?</h2>
        <div className="grid grid-cols-2 gap-2">
          <button className={`btn ${!isNew ? "btn-primary" : "btn-ghost"}`} onClick={() => setIsNew(false)}>Anak terdaftar</button>
          <button className={`btn ${isNew ? "btn-primary" : "btn-ghost"}`} onClick={() => { setIsNew(true); setChildId(""); }}>Anak baru</button>
        </div>
        {!isNew ? (
          <div>
            {child ? (
              <div className="flex items-center justify-between rounded-xl bg-leaf-soft p-3">
                <div><div className="font-bold">{child.name}</div><div className="text-xs text-mute">{child.sex === "L" ? "Laki-laki" : "Perempuan"} · {fmtAge(ageInMonths(child.birth, todayISO()))} · Posyandu {child.posyandu}</div></div>
                <button className="text-sm font-bold text-leaf underline" onClick={() => setChildId("")}>Ganti</button>
              </div>
            ) : (
              <>
                <label className="label" htmlFor="cari">Cari nama</label>
                <input id="cari" className="field" placeholder="Ketik nama anak" value={q} onChange={(e) => setQ(e.target.value)} />
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-white">
                  {matches.map((c) => (
                    <li key={c.id}><button className="flex min-h-14 w-full items-center justify-between px-3 text-left" onClick={() => setChildId(c.id)}><span className="font-bold">{c.name}</span><span className="text-xs text-mute">{c.posyandu}</span></button></li>
                  ))}
                  {matches.length === 0 && <li className="p-3 text-sm text-mute">Tidak ketemu. Pilih &quot;Anak baru&quot;.</li>}
                </ul>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            <div><label className="label" htmlFor="nm">Nama anak</label><input id="nm" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" /></div>
            <div className="grid grid-cols-2 gap-2">
              {(["L", "P"] as const).map((x) => <button key={x} className={`btn ${sex === x ? "btn-primary" : "btn-ghost"}`} onClick={() => setSex(x)}>{x === "L" ? "Laki-laki" : "Perempuan"}</button>)}
            </div>
            <div><label className="label" htmlFor="lh">Tanggal lahir</label><input id="lh" type="date" className="field" value={birth} max={date} onChange={(e) => setBirth(e.target.value)} /></div>
            <div><label className="label" htmlFor="wl">Nama orang tua (opsional)</label><input id="wl" className="field" value={guardian} onChange={(e) => setGuardian(e.target.value)} /></div>
          </div>
        )}

        <h2 className="pt-2 font-display text-xl font-semibold">2. Hasil ukur</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="bb">Berat (kg)</label><input id="bb" inputMode="decimal" className="field" placeholder="9,5" value={w} onChange={(e) => setW(e.target.value)} /></div>
          <div><label className="label" htmlFor="tb">{age != null && age < 24 ? "Panjang (cm)" : "Tinggi (cm)"}</label><input id="tb" inputMode="decimal" className="field" placeholder="75,5" value={h} onChange={(e) => setH(e.target.value)} /></div>
        </div>
        <div><label className="label" htmlFor="tg">Tanggal ukur</label><input id="tg" type="date" className="field" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></div>
        {age != null && <p className="text-sm text-mute">Usia saat diukur: <b className="text-ink">{fmtAge(age)}</b> ({age} bulan). {age < 24 ? "Di bawah 2 tahun diukur berbaring." : "2 tahun ke atas diukur berdiri."}</p>}
        {age != null && age > 60 && <p className="rounded-xl bg-berry-soft p-3 text-sm font-semibold text-berry">Usia di atas 60 bulan, di luar cakupan standar balita.</p>}
        {warn && <p className="rounded-xl bg-berry-soft p-3 text-sm font-semibold text-berry">{warn}</p>}
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-display text-xl font-semibold">3. Hasil</h2>
        {a && age != null ? (
          <>
            <Result a={a} age={age} />
            <button className="btn btn-primary mt-5 w-full" disabled={!canSave || saved} onClick={save}>{saved ? "Tersimpan ✓" : "Simpan penimbangan"}</button>
          </>
        ) : (
          <p className="text-mute">Isi data anak, berat, dan tinggi. Hasil z-score muncul di sini otomatis.</p>
        )}
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold">Catat penimbangan</h1>
      <Suspense fallback={null}><Form /></Suspense>
    </div>
  );
}
