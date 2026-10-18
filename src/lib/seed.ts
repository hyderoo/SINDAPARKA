import type { Child, Measurement } from "./types";
import { curve, type Sex } from "./who";
import { addMonths, ageInMonths } from "./age";

/** Small deterministic PRNG so the demo data is the same on every device. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const POSYANDU = ["Melati 1", "Melati 2", "Kenanga", "Mawar"];

const FIRST_L = ["Raka", "Dimas", "Fajar", "Bagas", "Arif", "Naufal", "Rizky", "Aditya", "Galih", "Yusuf", "Farel", "Bima", "Ilham", "Satria"];
const FIRST_P = ["Aisyah", "Nabila", "Salsa", "Zahra", "Citra", "Dewi", "Putri", "Alya", "Kirana", "Nayla", "Anindya", "Syifa", "Laras", "Fitri"];
const LAST = ["Pratama", "Saputra", "Wulandari", "Lestari", "Hidayat", "Kusuma", "Santoso", "Rahayu", "Nugroho", "Utami", "Setiawan", "Handayani"];
const MOM = ["Ibu Sri", "Ibu Siti", "Ibu Yuni", "Ibu Tri", "Ibu Wati", "Ibu Eni", "Ibu Dwi", "Ibu Rini", "Ibu Ani", "Ibu Nur"];

/** Reference "today" for the demo, so the seed never drifts out of the 0-60 month window. */
export function seedData(today: string): { children: Child[]; measurements: Measurement[] } {
  const r = rng(20260418);
  const children: Child[] = [];
  const measurements: Measurement[] = [];
  const N = 64;
  for (let i = 0; i < N; i++) {
    const sex: Sex = r() < 0.5 ? "L" : "P";
    const ageNow = 3 + Math.floor(r() * 54); // 3..56 months
    const birth = addMonths(today, -ageNow - (r() < 0.5 ? 0 : 0));
    const names = sex === "L" ? FIRST_L : FIRST_P;
    const name = `${names[Math.floor(r() * names.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
    const posyandu = POSYANDU[i % POSYANDU.length];
    const id = `c${String(i + 1).padStart(3, "0")}`;
    children.push({ id, name, sex, birth, posyandu, guardian: `${MOM[Math.floor(r() * MOM.length)]} (demo)` });

    // Each child gets a personal growth channel (z-score drift), some slip over time.
    const base = -1.9 + r() * 2.2 - (posyandu === "Kenanga" ? 0.6 : 0) + (posyandu === "Mawar" ? 0.3 : 0);
    const dr = r();
    const drift = dr < 0.22 ? -0.06 - r() * 0.08 : dr < 0.4 ? 0.04 : 0;
    const wBias = -0.5 + r() * 1.0;
    const visits = Math.min(ageNow, 9);
    for (let k = visits; k >= 0; k--) {
      const date = addMonths(today, -k);
      const age = ageInMonths(birth, date);
      if (age < 0) continue;
      const zh = base + drift * (visits - k) + (r() - 0.5) * 0.35;
      const zw = zh * 0.7 + wBias + (r() - 0.5) * 0.4;
      const h = curve("hfa", sex, [zh])[0].pts[Math.min(age, 60)].y;
      const w = curve("wfa", sex, [zw])[0].pts[Math.min(age, 60)].y;
      measurements.push({
        id: `m-${id}-${k}`,
        childId: id,
        date,
        height: Math.round(h * 10) / 10,
        weight: Math.round(w * 10) / 10,
      });
    }
  }
  return { children, measurements };
}
