"use client";
export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-primary no-print w-full sm:w-auto">Cetak satu halaman (A4)</button>
  );
}
