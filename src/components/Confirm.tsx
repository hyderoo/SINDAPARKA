"use client";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";

export type ConfirmOpts = {
  title: string;
  body?: string;
  /** What exactly will be removed (date, values) - shown as a highlighted summary. */
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type Req = ConfirmOpts & { resolve: (v: boolean) => void };
const Ctx = createContext<(o: ConfirmOpts) => Promise<boolean>>(() => Promise.resolve(false));

export function useConfirm() {
  return useContext(Ctx);
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function Dialog({ req, close }: { req: Req; close: (v: boolean) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = box.current?.querySelector<HTMLElement>("[data-initial]") ?? box.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); close(false); return; }
      if (e.key !== "Tab" || !box.current) return;
      const items = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute("disabled"));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!box.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", key, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", key, true);
      prev?.focus?.();
    };
  }, [close]);

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:items-center" role="presentation">
      <button aria-hidden tabIndex={-1} className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-[2px]" onClick={() => close(false)} />
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={req.body || req.detail ? descId : undefined}
        className="relative w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-xl"
      >
        <h2 id={titleId} className="font-display text-lg font-semibold">{req.title}</h2>
        {(req.body || req.detail) && (
          <div id={descId} className="mt-2 space-y-2">
            {req.detail && (
              <p className="rounded-xl bg-paper px-3 py-2 text-sm font-semibold tabular-nums">{req.detail}</p>
            )}
            {req.body && <p className="text-sm text-mute">{req.body}</p>}
          </div>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button data-initial className="btn btn-ghost" onClick={() => close(false)}>{req.cancelLabel ?? "Batal"}</button>
          <button
            className={`btn ${req.destructive ? "bg-berry text-white hover:bg-[#B3261E]" : "btn-primary"}`}
            onClick={() => close(true)}
          >
            {req.confirmLabel ?? "Ya"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [req, setReq] = useState<Req | null>(null);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setReq({ ...o, resolve })), []);
  const close = useCallback((v: boolean) => {
    setReq((r) => { r?.resolve(v); return null; });
  }, []);
  return (
    <Ctx.Provider value={confirm}>
      {children}
      {req && <Dialog req={req} close={close} />}
    </Ctx.Provider>
  );
}
