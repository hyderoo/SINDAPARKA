"use client";
import Link from "next/link";
import { useState } from "react";
import { actions } from "@/lib/store";
import { AuthFrame, Msg } from "@/components/Auth";

export default function Daftar() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { setErr("Kata sandi minimal 8 karakter."); return; }
    setBusy(true);
    setErr(null);
    const r = await actions.signUp(email, pw, name);
    setBusy(false);
    if (r.error) setErr(r.error);
    else setOk(true);
  };
  if (ok)
    return (
      <AuthFrame title="Cek email Anda">
        <Msg kind="ok">Kami mengirim tautan konfirmasi ke {email}. Setelah dikonfirmasi, akun Anda menunggu persetujuan admin puskesmas sebelum bisa melihat data anak.</Msg>
        <Link href="/masuk" className="btn btn-ghost mt-4 w-full">Ke halaman masuk</Link>
      </AuthFrame>
    );
  return (
    <AuthFrame title="Daftar akun" sub="Untuk kader dan tenaga kesehatan. Akun baru perlu disetujui admin sebelum bisa dipakai.">
      <form onSubmit={submit} className="grid gap-4">
        <div><label className="label" htmlFor="nm">Nama lengkap</label><input id="nm" required autoComplete="name" className="field" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label" htmlFor="em">Email</label><input id="em" type="email" autoComplete="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label" htmlFor="pw">Kata sandi (min. 8 karakter)</label><input id="pw" type="password" autoComplete="new-password" required minLength={8} className="field" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        {err && <Msg kind="err">{err}</Msg>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Mendaftar..." : "Daftar"}</button>
      </form>
      <p className="mt-4 text-sm">Sudah punya akun? <Link href="/masuk" className="font-bold text-leaf underline">Masuk</Link></p>
    </AuthFrame>
  );
}
