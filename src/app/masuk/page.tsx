"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { actions, readRecentKader, useStore, type RecentKader } from "@/lib/store";
import { AuthFrame, Msg } from "@/components/Auth";

export default function Masuk() {
  const router = useRouter();
  const s = useStore();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);
  // Client-only list (localStorage), read during render after mount to avoid hydration mismatch.
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [, bump] = useState(0);
  const recent: RecentKader[] = mounted ? readRecentKader() : [];
  useEffect(() => { if (s?.userId) router.replace(s.status === "active" ? "/dashboard" : "/menunggu"); }, [s?.userId, s?.status, router]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(await actions.signIn(email, pw));
    setBusy(false);
  };
  const pick = (r: RecentKader) => { setEmail(r.email); setErr(null); pwRef.current?.focus(); };
  const forget = (em: string) => { actions.forgetKader(em); bump((n) => n + 1); };
  return (
    <AuthFrame title="Masuk" sub="Gunakan akun kader atau tenaga kesehatan Anda.">
      {recent.length > 0 && (
        <div className="mb-4">
          <p className="label">Akun di perangkat ini</p>
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.email} className="flex items-center gap-2">
                <button type="button" onClick={() => pick(r)} className={`flex min-h-12 flex-1 items-center gap-3 rounded-xl border px-3 text-left ${email === r.email ? "border-leaf bg-leaf-soft" : "border-line bg-white"}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leaf-soft font-display text-sm font-bold text-leaf-deep" aria-hidden>{(r.name || r.email)[0]?.toUpperCase()}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{r.name}</span>
                    <span className="block truncate text-xs text-mute">{r.email}</span>
                  </span>
                </button>
                <button type="button" onClick={() => forget(r.email)} aria-label={`Lupakan ${r.email} di perangkat ini`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-mute" title="Lupakan di perangkat ini">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-mute">Untuk perangkat bersama: pilih akun Anda, lalu tetap ketik kata sandi. Yang disimpan hanya nama dan email, bukan kata sandi. Tanda silang melupakan akun di perangkat ini.</p>
        </div>
      )}
      <form onSubmit={submit} className="grid gap-4">
        <div><label className="label" htmlFor="em">Email</label><input id="em" type="email" autoComplete="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label" htmlFor="pw">Kata sandi</label><input id="pw" ref={pwRef} type="password" autoComplete="current-password" required className="field" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
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
