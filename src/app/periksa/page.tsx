"use client";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useScope } from "@/lib/scope";
import { actions } from "@/lib/store";
import { ageInMonths, daysBetween, fmtAge, fmtDate, todayISO } from "@/lib/age";
import { assess, correctHeight, plausible, type Sex } from "@/lib/who";
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
  const [saved, setSaved] = useState<"sent" | "queued" | false>(false);
  const [consent, setConsent] = useState(false);
  const [posId, setPosId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dupAckFor, setDupAckFor] = useState<string | null>(null);
  const [posture, setPosture] = useState<"auto" | "lying" | "standing">("auto");

  const resRef = useRef<HTMLElement>(null);
  const [resSeen, setResSeen] = useState(false);
  useEffect(() => {
    const el = resRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setResSeen(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  });
  const noKids = !!sc && sc.children.length === 0;
  const [prevNoKids, setPrevNoKids] = useState(noKids);
  if (noKids !== prevNoKids) { setPrevNoKids(noKids); if (noKids) setIsNew(true); }
  const pick = (id: string) => { setChildId(id); setTimeout(() => document.getElementById("bb")?.focus(), 50); };
  const child = sc?.children.find((c) => c.id === childId);
  const eSex = isNew ? sex : child?.sex;
  const eBirth = isNew ? birth : child?.birth;
  const age = eBirth ? ageInMonths(eBirth, date) : null;
  const wn = parseFloat(w.replace(",", "."));
  const hn = parseFloat(h.replace(",", "."));
  const numsOk = Number.isFinite(wn) && Number.isFinite(hn);
  const warn = age != null && numsOk ? plausible(age, wn, hn) : null;
  const lying = posture === "auto" ? (age != null ? age <= 24 : true) : posture === "lying";
  // Compare against the previous measurement of the same child: catch likely mis-measurements before saving.
  const prevPt = !isNew && child && sc ? sc.rows.find((r) => r.child.id === child.id)?.last : undefined;
  const impl: string[] = [];
  if (prevPt && numsOk && age != null && !warn && date >= prevPt.m.date) {
    const days = Math.max(1, daysBetween(prevPt.m.date, date));
    const hPrev = correctHeight(prevPt.age, prevPt.m.height, prevPt.m.lying ?? prevPt.age <= 24);
    const hNow = correctHeight(age, hn, lying);
    const dH = Math.round((hNow - hPrev) * 10) / 10;
    const dW = Math.round((wn - prevPt.m.weight) * 100) / 100;
    const f = (v: number) => String(Math.abs(v)).replace(".", ",");
    if (dH < -0.4) impl.push(`Tinggi menyusut ${f(dH)} cm dari penimbangan ${fmtDate(prevPt.m.date)}. Tinggi badan hampir tidak pernah turun; periksa ulang cara ukur dan alatnya.`);
    else if (days <= 45 && dH > 8) impl.push(`Tinggi naik ${f(dH)} cm dalam ${days} hari, terlalu cepat untuk balita. Periksa ulang pengukuran.`);
    if (days <= 45 && Math.abs(dW) > 2) impl.push(`Berat ${dW > 0 ? "naik" : "turun"} ${f(dW)} kg dalam ${days} hari. Perubahan sebesar ini jarang terjadi; timbang ulang sebelum disimpan.`);
    else if (days > 45 && dW < -3) impl.push(`Berat turun ${f(dW)} kg dari penimbangan terakhir. Kalau benar, anak perlu diperiksa; kalau ragu, timbang ulang.`);
  }

  const a = eSex && age != null && numsOk && !warn ? assess(eSex, age, wn, hn, lying) : null;
  const matches = useMemo(() => (sc ? sc.children.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : []), [sc, q]);
  const dup = !isNew && child && sc ? sc.measurements.filter((m) => m.childId === child.id && m.date === date) : [];
  const dupSig = `${childId}|${date}`;
  if (!sc) return null;

  const ownPosId = sc.s.role === "kader" ? sc.s.posyanduId ?? "" : posId || sc.s.posyanduList[0]?.id || "";
  const canSave = !!a && (isNew ? name.trim().length > 1 && !!birth && birth <= date && consent && !!ownPosId : !!child);
  const save = async () => {
    if (!a || busy) return;
    if (dup.length > 0 && dupAckFor !== dupSig) { setDupAckFor(dupSig); return; }
    setBusy(true);
    setErr(null);
    let offline = !navigator.onLine;
    let id = childId;
    if (!offline && isNew) {
      const r = await actions.addChild({ name: name.trim(), sex, birth, posyanduId: ownPosId, guardian: guardian.trim(), consentAt: todayISO() });
      if (r.error || !r.id) {
        if (r.error && (r.error.toLowerCase().includes("fetch") || r.error.toLowerCase().includes("koneksi"))) {
          // fell offline mid-save: keep everything on the device instead of losing it
          offline = true;
          id = crypto.randomUUID();
        } else { setErr(r.error ?? "Gagal menyimpan data anak."); setBusy(false); return; }
      } else id = r.id;
    } else if (offline && isNew) id = crypto.randomUUID();
    if (offline) {
      // offline path: queue locally, z-scores are computed when the entry is sent
      actions.queueMeasurement({
        childId: id, isNewChild: isNew, childName: isNew ? name.trim() : child!.name, childSex: eSex!, childBirth: eBirth!,
        posyanduId: isNew ? ownPosId : child!.posyanduId, guardian: guardian.trim(), consentAt: todayISO(),
        date, weight: wn, height: hn, lying,
      });
      setSaved("queued");
      setBusy(false);
      setTimeout(() => router.push("/dashboard"), 1200);
      return;
    }
    const e = await actions.addMeasurement({ childId: id, date, weight: wn, height: hn, lying });
    if (e) {
      if (e.toLowerCase().includes("fetch") || e.toLowerCase().includes("koneksi")) {
        actions.queueMeasurement({
          childId: id, isNewChild: false, childName: child?.name ?? "", childSex: eSex!, childBirth: eBirth!,
          posyanduId: child?.posyanduId ?? ownPosId, guardian: guardian.trim(), consentAt: todayISO(),
          date, weight: wn, height: hn, lying,
        });
        setSaved("queued");
        setBusy(false);
        setTimeout(() => router.push("/dashboard"), 1200);
        return;
      }
      setErr(e); setBusy(false); return;
    }
    setSaved("sent");
    setTimeout(() => router.push(`/anak/${id}`), 700);
  };

  return (
    <div className="grid gap-5 pb-20 lg:grid-cols-2 lg:pb-0">
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
                <button className="min-h-11 px-3 text-sm font-bold text-leaf underline" onClick={() => setChildId("")}>Ganti</button>
              </div>
            ) : (
              <>
                <label className="label" htmlFor="cari">Cari nama</label>
                <input id="cari" className="field" placeholder="Ketik nama anak" value={q} onChange={(e) => setQ(e.target.value)} />
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-white">
                  {matches.map((c) => (
                    <li key={c.id}><button className="flex min-h-14 w-full items-center justify-between px-3 text-left" onClick={() => pick(c.id)}><span className="font-bold">{c.name}</span><span className="text-xs text-mute">{c.posyandu}</span></button></li>
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
            {sc.s.role !== "kader" && (
              <div><label className="label" htmlFor="ps">Posyandu</label><select id="ps" className="field" value={ownPosId} onChange={(e) => setPosId(e.target.value)}>{sc.s.posyanduList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            )}
            <label className="flex items-start gap-3 rounded-xl border border-line bg-bg p-3 text-sm">
              <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>Orang tua atau wali sudah diberi tahu dan menyetujui data anak ini dicatat di SINDAPARKA. Tanggal persetujuan dicatat hari ini. <Link href="/privasi/persetujuan" target="_blank" className="font-bold text-leaf underline">Lihat formulir persetujuan (rancangan)</Link></span>
            </label>
          </div>
        )}

        <h2 className="pt-2 font-display text-xl font-semibold">2. Hasil ukur</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="bb">Berat (kg)</label><input id="bb" inputMode="decimal" className="field" placeholder="9,5" value={w} onChange={(e) => setW(e.target.value)} enterKeyHint="next" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); document.getElementById("tb")?.focus(); } }} /></div>
          <div><label className="label" htmlFor="tb">{age != null && age <= 24 ? "Panjang (cm)" : "Tinggi (cm)"}</label><input id="tb" inputMode="decimal" className="field" placeholder="75,5" value={h} onChange={(e) => setH(e.target.value)} /></div>
        </div>
        <div>
          <span className="label">Cara ukur</span>
          <div className="grid grid-cols-2 gap-2">
            {([["lying", "Berbaring"], ["standing", "Berdiri"]] as const).map(([k, l]) => (
              <button key={k} type="button" className={`btn ${(posture === "auto" ? (lying ? "lying" : "standing") : posture) === k ? "btn-primary" : "btn-ghost"}`} onClick={() => setPosture(k)}>{l}</button>
            ))}
          </div>
          <p className="mt-1 text-xs text-mute">Standar: 0 sampai 24 bulan berbaring, di atas 24 bulan berdiri. Kalau cara ukur berbeda, hasil dikoreksi 0,7 cm sesuai Permenkes 2/2020.</p>
        </div>
        <div><label className="label" htmlFor="tg">Tanggal ukur</label><input id="tg" type="date" className="field" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></div>
        <Link href="/panduan" className="inline-flex min-h-11 items-center text-sm font-bold text-leaf underline">Panduan menimbang dan mengukur yang benar</Link>
        {age != null && <p className="text-sm text-mute">Usia saat diukur: <b className="text-ink">{fmtAge(age)}</b> ({age} bulan). </p>}
        {dup.length > 0 && (
          <p role="alert" className="rounded-xl bg-[#FDF3E0] p-3 text-sm font-semibold text-[#9A6B00]">
            {child!.name} sudah ditimbang pada {fmtDate(date)} ({dup.map((m) => `${String(m.weight).replace(".", ",")} kg, ${String(m.height).replace(".", ",")} cm`).join(" dan ")}).
            Menyimpan akan menambah catatan kedua di hari yang sama. Kalau ini koreksi, hapus dulu catatan sebelumnya di halaman anak.
          </p>
        )}
        {age != null && age > 60 && <p className="rounded-xl bg-berry-soft p-3 text-sm font-semibold text-berry">Usia di atas 60 bulan, di luar cakupan standar balita.</p>}
        {warn && <p className="rounded-xl bg-berry-soft p-3 text-sm font-semibold text-berry">{warn}</p>}
        {impl.map((m) => (
          <p key={m} role="alert" className="rounded-xl bg-[#FDF3E0] p-3 text-sm font-semibold text-[#9A6B00]">{m}</p>
        ))}
      </section>

      <section ref={resRef} id="hasil" className="card scroll-mt-4 p-5">
        <h2 className="mb-3 font-display text-xl font-semibold">3. Hasil</h2>
        {a && age != null ? (
          <>
            <Result a={a} age={age} />
            <button className="btn btn-primary mt-5 w-full" disabled={!canSave || !!saved || busy} onClick={save}>{saved === "sent" ? "Tersimpan ✓" : saved === "queued" ? "Disimpan di perangkat ✓" : busy ? "Menyimpan..." : dup.length > 0 && dupAckFor !== dupSig ? "Tetap simpan (pengukuran kedua)" : "Simpan penimbangan"}</button>
            {saved === "queued" && <p role="status" className="mt-3 rounded-xl bg-[#FDF3E0] p-3 text-sm font-semibold text-[#9A6B00]">Tidak ada sinyal. Catatan tersimpan di perangkat ini dan terkirim otomatis begitu ada sinyal.</p>}
            {err && <p role="alert" className="mt-3 rounded-xl bg-berry-soft p-3 text-sm font-semibold text-berry">{err}</p>}
          </>
        ) : (
          <p className="text-mute">Isi data anak, berat, dan tinggi. Hasil z-score muncul di sini otomatis.</p>
        )}
      </section>
      {a && !resSeen && (
        <div className="no-print fixed inset-x-4 bottom-[88px] z-10 lg:hidden">
          <button type="button" className="btn btn-primary w-full shadow-lg" onClick={() => document.getElementById("hasil")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            Lihat hasil: {a.sHfa ? a.sHfa.label : "selesai"}{canSave ? " dan simpan" : ""}
          </button>
        </div>
      )}
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
