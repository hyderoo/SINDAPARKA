import Link from "next/link";
import { Logo } from "@/components/Shell";
import { Partners } from "@/components/Partners";

export function AuthFrame({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Logo size={32} />
        <span className="font-display text-2xl font-bold">SINDAPARKA</span>
      </Link>
      <div className="card p-6">
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {sub && <p className="mt-1 text-sm text-mute">{sub}</p>}
        <div className="mt-5">{children}</div>
      </div>
      <Partners />
      <p className="mt-6 text-center text-xs text-mute">
        <Link href="/privasi" className="underline">Privasi</Link> · <Link href="/metode" className="underline">Cara hitung dan batasannya</Link>
      </p>
    </main>
  );
}

export function Msg({ kind, children }: { kind: "err" | "ok"; children: React.ReactNode }) {
  return <p role={kind === "err" ? "alert" : "status"} className={`rounded-xl p-3 text-sm font-semibold ${kind === "err" ? "bg-berry-soft text-berry" : "bg-leaf-soft text-leaf-deep"}`}>{children}</p>;
}
