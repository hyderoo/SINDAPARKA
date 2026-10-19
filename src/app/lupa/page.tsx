"use client";
import Link from "next/link";
import { useState } from "react";
import { actions } from "@/lib/store";
import { AuthFrame, Msg } from "@/components/Auth";

export default function Lupa() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await actions.resetPassword(email);
    if (r) setErr(r);
    else setDone(true);
  };
  return (
    <AuthFrame title="Atur ulang kata sandi" sub="Kami kirim tautan ke email yang terdaftar.">
      {done ? (
        <Msg kind="ok">Jika email terdaftar, tautan atur ulang sudah dikirim. Cek kotak masuk dan folder spam.</Msg>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <div><label className="label" htmlFor="em">Email</label><input id="em" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {err && <Msg kind="err">{err}</Msg>}
          <button className="btn btn-primary w-full">Kirim tautan</button>
        </form>
      )}
      <Link href="/masuk" className="mt-4 block text-sm font-bold text-leaf underline">Kembali ke masuk</Link>
    </AuthFrame>
  );
}
