/** Whole months between two ISO dates (floor), never negative. */
export function ageInMonths(birth: string, on: string): number {
  const b = new Date(birth + "T00:00:00");
  const d = new Date(on + "T00:00:00");
  let m = (d.getFullYear() - b.getFullYear()) * 12 + (d.getMonth() - b.getMonth());
  if (d.getDate() < b.getDate()) m -= 1;
  return Math.max(0, m);
}
export const todayISO = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export function addMonths(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}
export function fmtMonthYear(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${BULAN[m - 1]} ${y}`;
}
export function fmtAge(months: number): string {
  if (months < 12) return `${months} bln`;
  const y = Math.floor(months / 12);
  const r = months % 12;
  return r ? `${y} th ${r} bln` : `${y} th`;
}
export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000);
}

/** "Melati 1" -> "Posyandu Melati 1"; keeps names that already start with "Posyandu". */
export const posLabel = (n: string) => (/^posyandu\b/i.test(n) ? n : `Posyandu ${n}`);
