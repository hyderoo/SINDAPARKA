"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { actions, useOnline, useStore } from "@/lib/store";
import { t, type Key } from "@/lib/i18n";

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

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden>
      <rect width="512" height="512" rx="112" fill="#0B63CE" />
      <path d="M150 380V250M256 380V170M362 380V210" stroke="#F4F6F9" strokeWidth="44" strokeLinecap="round" />
      <circle cx="256" cy="116" r="30" fill="#F9AB00" />
    </svg>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const s = useStore();
  const path = usePathname();
  const router = useRouter();
  const online = useOnline();
  const lang = s?.lang ?? "id";
  const isLanding = path === "/";

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    if (s && !s.role && !isLanding) router.replace("/");
  }, [s, isLanding, router]);

  if (isLanding) return <>{children}</>;
  if (!s || !s.role) return <div className="p-8 text-mute">Memuat...</div>;
  const pending = s.measurements.filter((m) => m.pending).length;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1240px]">
      <aside className="no-print sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 p-5 md:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-3">
          <Logo />
          <span className="font-display text-xl font-bold">SINDAPARKA</span>
        </Link>
        {NAV.map((n) => {
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
            <div className="font-bold">{s.role === "admin" ? "Admin puskesmas" : `Kader ${s.posyandu}`}</div>
            <button className="mt-1 underline" onClick={() => { actions.logout(); router.push("/"); }}>{t(lang, "logout")}</button>
          </div>
          <div className="flex gap-2">
            {(["id", "en"] as const).map((l) => (
              <button key={l} onClick={() => actions.setLang(l)} className={`min-h-10 flex-1 rounded-lg text-xs font-bold uppercase ${lang === l ? "bg-ink text-white" : "border border-line text-mute"}`}>{l}</button>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-28 md:pb-10">
        <div className="no-print flex items-center gap-2 px-4 pt-3 text-xs md:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 md:hidden"><Logo size={28} /><span className="font-display text-lg font-bold">SINDAPARKA</span></Link>
          <div className="ml-auto flex items-center gap-2">
            <span className={`chip ${online ? "chip-ok" : "chip-moderate"}`}>{online ? "Online" : t(lang, "offline")}</span>
            {pending > 0 && (
              <button disabled={!online} onClick={() => actions.syncPending()} className="chip chip-watch min-h-9 disabled:opacity-50">
                {pending} {t(lang, "pending")} · {t(lang, "sync")}
              </button>
            )}
            <div className="flex gap-1 md:hidden">
              {(["id", "en"] as const).map((l) => (
                <button key={l} onClick={() => actions.setLang(l)} className={`min-h-9 rounded-lg px-2 text-xs font-bold uppercase ${lang === l ? "bg-ink text-white" : "border border-line text-mute"}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="no-print mx-4 mt-2 rounded-xl bg-sun-soft px-3 py-2 text-xs font-semibold text-[#7A5B00] md:mx-8">{t(lang, "demo")}</div>
        <main className="px-4 pt-4 md:px-8 md:pt-6">{children}</main>
      </div>

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
