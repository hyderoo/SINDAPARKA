"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { actions } from "@/lib/store";
import { AuthFrame, Msg } from "@/components/Auth";

export default function AturUlang() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { setErr("Kata sandi minimal 8 karakter."); return; }
    const r = await actions.setPassword(pw);
    if (r) setErr(r);
    else { setOk(true); setTimeout(() => router.replace("/dashboard"), 1200); }
  };
  return (
    <AuthFrame title="Kata sandi baru" sub="Buka halaman ini dari tautan di email atur ulang.">
      {ok ? <Msg kind="ok">Kata sandi diganti.</Msg> : (
        <form onSubmit={submit} className="grid gap-4">
          <div><label className="label" htmlFor="pw">Kata sandi baru</label><input id="pw" type="password" autoComplete="new-password" required minLength={8} className="field" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          {err && <Msg kind="err">{err}</Msg>}
          <button className="btn btn-primary w-full">Simpan</button>
        </form>
      )}
    </AuthFrame>
  );
}
