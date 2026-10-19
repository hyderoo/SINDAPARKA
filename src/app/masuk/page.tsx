"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { actions, useStore } from "@/lib/store";
import { AuthFrame, Msg } from "@/components/Auth";

export default function Masuk() {
  const router = useRouter();
  const s = useStore();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (s?.userId) router.replace(s.status === "active" ? "/dashboard" : "/menunggu"); }, [s?.userId, s?.status, router]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(await actions.signIn(email, pw));
    setBusy(false);
  };
  return (
    <AuthFrame title="Masuk" sub="Gunakan akun kader atau tenaga kesehatan Anda.">
      <form onSubmit={submit} className="grid gap-4">
        <div><label className="label" htmlFor="em">Email</label><input id="em" type="email" autoComplete="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label" htmlFor="pw">Kata sandi</label><input id="pw" type="password" autoComplete="current-password" required className="field" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        {err && <Msg kind="err">{err}</Msg>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Memeriksa..." : "Masuk"}</button>
      </form>
      <div className="mt-4 flex justify-between text-sm font-bold text-leaf">
        <Link href="/lupa" className="underline">Lupa kata sandi</Link>
        <Link href="/daftar" className="underline">Daftar akun</Link>
      </div>
    </AuthFrame>
  );
}
