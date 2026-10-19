export const Sk = ({ className = "" }: { className?: string }) => <div className={`sk ${className}`} aria-hidden />;

/** Page-shaped placeholder: heading, four stat cards, a chart card and two list rows. Same card sizes as the real dashboard, so nothing jumps when data arrives. */
export function PageSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Memuat data">
      <Sk className="h-4 w-40" />
      <Sk className="h-9 w-64 max-w-full" />
      <div className="grid grid-cols-2 gap-3 pt-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card space-y-3 p-4"><Sk className="h-3 w-24" /><Sk className="h-9 w-16" /><Sk className="h-3 w-28" /></div>
        ))}
      </div>
      <div className="card space-y-4 p-5"><Sk className="h-5 w-48" /><Sk className="h-40 w-full" /></div>
      {[0, 1].map((i) => (
        <div key={i} className="card flex items-center gap-3 p-4"><Sk className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><Sk className="h-4 w-1/2" /><Sk className="h-3 w-2/3" /></div></div>
      ))}
      <span className="sr-only">Memuat data...</span>
    </div>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card mx-auto mt-10 max-w-md space-y-3 p-6 text-center" role="alert">
      <h2 className="font-display text-xl font-semibold">Data belum bisa dimuat</h2>
      <p className="text-sm text-mute">{message}</p>
      <button className="btn btn-primary w-full" onClick={onRetry}>Coba lagi</button>
    </div>
  );
}
