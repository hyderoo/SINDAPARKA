"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { actions, useOnline, useStore } from "@/lib/store";
import { t, type Key } from "@/lib/i18n";
import { LoadError, PageSkeleton } from "@/components/Skeleton";

const NAV: { href: string; k: Key; icon: string; adminOnly?: boolean }[] = [
  { href: "/dashboard", k: "nav_dashboard", icon: "M3 12l9-8 9 8M5 10v10h14V10" },
  { href: "/periksa", k: "nav_periksa", icon: "M12 5v14M5 12h14" },
  { href: "/anak", k: "nav_anak", icon: "M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21c0-4 4-6 8-6s8 2 8 6" },
  { href: "/jadwal", k: "nav_jadwal", icon: "M5 6h14v14H5zM5 10h14M9 3v5M15 3v5" },
  { href: "/laporan", k: "nav_laporan", icon: "M6 3h9l4 4v14H6zM9 12h7M9 16h7" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

/* Official logos, unaltered: full BKKBN lockup (kemendukbangga.go.id) and Undip (undip.ac.id). */
export function Logo({ size = 36 }: { size?: number }) {
  const h = Math.round(size * 1.0);
  return (
    <span className="flex shrink-0 items-center gap-2" aria-label="BKKBN dan Universitas Diponegoro" role="img">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logos/bkkbn.png" width={1200} height={320} alt="" style={{ height: Math.round(h * 1.15), width: "auto" }} />
      <span className="h-6 w-px bg-line" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logos/undip.png" width={381} height={446} alt="" style={{ height: h, width: "auto" }} />
    </span>
  );
}

function SyncBar() {
  const s = useStore();
  const online = useOnline();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  if (!s || !s.userId || s.queue.length === 0) return null;
  const errs = s.queue.filter((q) => q.error).length;
  return (
    <div className="no-print fixed inset-x-4 bottom-[84px] z-30 md:inset-x-auto md:bottom-6 md:right-8 md:w-[26rem]">
      <div className="card border-2 border-sun p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="min-w-0 flex-1 text-sm font-bold">{s.queue.length} catatan menunggu dikirim{errs > 0 ? ` (${errs} perlu diperbaiki)` : ""}</span>
          <button className="btn btn-ghost !min-h-10 shrink-0 px-3 text-sm" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Tutup" : "Lihat"}</button>
          <button className="btn btn-primary !min-h-10 shrink-0 px-3 text-sm" disabled={!online || busy}
            onClick={async () => { setBusy(true); await actions.syncQueue(); setBusy(false); }}>
            {busy ? "Mengirim..." : online ? "Kirim sekarang" : "Offline"}
          </button>
        </div>
        {open && (
          <div className="mt-2 border-t border-line pt-2">
            <p className="mb-2 text-xs text-mute">Ditimbang saat tidak ada sinyal. Tersimpan sementara di perangkat ini dan dikirim otomatis begitu ada sinyal. Tidak ada yang ditimpa: kalau server menolak, catatan tetap di sini.</p>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {s.queue.map((q) => (
                <li key={q.id} className="flex items-center gap-2 rounded-lg bg-bg p-2 text-sm">
                  <span className="min-w-0 flex-1">
                    <b>{q.childName}</b>{q.isNewChild ? " (anak baru)" : ""} · {q.date} · {String(q.weight).replace(".", ",")} kg
                    {q.error && <span className="block text-xs font-semibold text-berry">{q.error}</span>}
                  </span>
                  <button className="min-h-10 shrink-0 px-2 text-xs font-bold text-berry underline" onClick={() => { if (confirm("Hapus catatan yang belum terkirim ini dari perangkat?")) actions.removeQueued(q.id); }}>Hapus</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountMenu() {
  const s = useStore();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent | TouchEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("touchstart", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("touchstart", down); document.removeEventListener("keydown", key); };
  }, [open]);
  if (!s) return null;
  const who = s.fullName || s.email || "Akun";
  const role = s.role === "admin" ? "Admin" : s.role === "nakes" ? "Tenaga kesehatan" : `Kader ${s.posyandu}`;
  return (
    <div ref={ref} className="relative md:hidden">
      <button aria-haspopup="menu" aria-expanded={open} aria-label="Menu akun" onClick={() => setOpen(!open)} className="flex h-11 min-w-11 items-center justify-center gap-1 rounded-full border border-line bg-white px-3 font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-leaf-soft font-display text-sm text-leaf-deep">{who[0]?.toUpperCase()}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
          <div className="border-b border-line p-3"><div className="truncate font-bold">{who}</div><div className="truncate text-xs text-mute">{role}</div></div>
          {s.role === "admin" && <Link role="menuitem" href="/admin" className="flex min-h-12 items-center px-3 text-sm font-bold">Kelola akun (Admin)</Link>}
          <Link role="menuitem" href="/metode" className="flex min-h-12 items-center px-3 text-sm font-bold">Cara hitung dan batasannya</Link>
          <Link role="menuitem" href="/privasi" className="flex min-h-12 items-center px-3 text-sm font-bold">Privasi data anak</Link>
          <button role="menuitem" className="flex min-h-12 w-full items-center border-t border-line px-3 text-left text-sm font-bold text-berry" onClick={async () => { await actions.signOut(); router.push("/masuk"); }}>Keluar</button>
        </div>
      )}
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const s = useStore();
  const path = usePathname();
  const router = useRouter();
  const online = useOnline();
  const lang = s?.lang ?? "id";
  const PUBLIC = ["/", "/masuk", "/daftar", "/lupa", "/atur-ulang", "/menunggu", "/privasi", "/metode", "/panduan"];
  const isLanding = PUBLIC.includes(path);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    if (!s || !s.ready || isLanding) return;
    if (!s.userId) router.replace("/masuk");
    else if (s.status !== "active") router.replace("/menunggu");
  }, [s, isLanding, router]);

  if (isLanding) return <>{children}</>;
  if (!s || !s.ready || !s.userId || s.status !== "active") return <div className="mx-auto max-w-[1240px] p-4 md:p-8"><PageSkeleton /></div>;
  const MAP = { href: "/peta", k: "nav_peta" as Key, icon: "M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11zM12 12a2 2 0 100-4 2 2 0 000 4z" };
  const nav = s.role === "admin" ? [...NAV, MAP, { href: "/admin", k: "nav_admin" as Key, icon: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" }] : [...NAV, MAP];

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1240px]">
      <aside className="no-print sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 p-5 md:flex">
        <Link href="/dashboard" className="mb-6 flex flex-col items-start gap-2">
          <Logo size={30} />
          <span className="font-display text-xl font-bold">SINDAPARKA</span>
        </Link>
        {nav.map((n) => {
          const on = path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 font-bold ${on ? "bg-leaf text-white" : "text-ink hover:bg-leaf-soft"}`}>
              <Icon d={n.icon} />
              {t(lang, n.k)}
            </Link>
          );
        })}
        <div className="mt-auto space-y-2 text-sm">
          <div className="rounded-xl bg-leaf-soft p-3 text-leaf-deep">
            <div className="font-bold">{s.fullName || s.email}</div>
            <div className="text-xs">{s.role === "admin" ? "Admin" : s.role === "nakes" ? "Tenaga kesehatan" : `Kader ${s.posyandu}`}</div>
            <button className="mt-1 underline" onClick={async () => { await actions.signOut(); router.push("/masuk"); }}>{t(lang, "logout")}</button>
          </div>
          <div className="flex gap-2">
            {(["id", "en"] as const).map((l) => (
              <button key={l} onClick={() => actions.setLang(l)} className={`min-h-10 flex-1 rounded-lg text-xs font-bold uppercase ${lang === l ? "bg-ink text-white" : "border border-line text-mute"}`}>{l}</button>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-28 md:pb-10">
        <header className="no-print flex items-center gap-2 px-4 pt-3 text-xs md:justify-end md:px-8">
          <Link href="/dashboard" className="flex min-h-11 min-w-0 items-center gap-2 md:hidden"><Logo size={26} /><span className="hidden font-display text-base font-bold min-[400px]:inline">SINDAPARKA</span></Link>
          <div className="ml-auto flex items-center gap-2">
            {!online && <span className="chip chip-moderate">{t(lang, "offline")}</span>}
            <AccountMenu />
          </div>
        </header>
        <main className="px-4 pt-4 md:px-8 md:pt-6">{s.error ? <LoadError message={s.error} onRetry={() => actions.refresh()} /> : !s.loaded ? <PageSkeleton /> : children}</main>
      </div>
      <SyncBar />

      <nav className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Menu utama">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {NAV.map((n) => {
            const on = path.startsWith(n.href);
            const center = n.href === "/periksa";
            return (
              <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${on ? "text-leaf" : "text-mute"}`}>
                {center ? (
                  <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-clay text-white shadow-lg"><Icon d={n.icon} /></span>
                ) : (
                  <Icon d={n.icon} />
                )}
                {t(lang, n.k)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
