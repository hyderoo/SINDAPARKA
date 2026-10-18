import data from "./who.json";

export type Sex = "L" | "P";
type Row = [number, number, number, number]; // x, L, M, S
const T = data as unknown as Record<string, Row[]>;

function row(table: Row[], x: number): [number, number, number] | null {
  if (!table.length) return null;
  const first = table[0][0];
  const last = table[table.length - 1][0];
  if (x < first - 1e-9 || x > last + 1e-9) return null;
  // tables are evenly stepped; interpolate linearly between neighbours
  let lo = 0;
  for (let i = 0; i < table.length; i++) {
    if (table[i][0] <= x + 1e-9) lo = i;
    else break;
  }
  const a = table[lo];
  const b = table[Math.min(lo + 1, table.length - 1)];
  const t = b[0] === a[0] ? 0 : (x - a[0]) / (b[0] - a[0]);
  return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t];
}

/** Value of the curve at a given z, from the LMS parameters. */
function valueAtZ(L: number, M: number, S: number, z: number) {
  return L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L);
}

/** WHO z-score. `restricted` applies the WHO tail adjustment used for weight-based indicators. */
function zscore(y: number, L: number, M: number, S: number, restricted: boolean) {
  const z = L === 0 ? Math.log(y / M) / S : (Math.pow(y / M, L) - 1) / (L * S);
  if (!restricted || Math.abs(z) <= 3) return z;
  const sd3 = valueAtZ(L, M, S, 3);
  const sd2 = valueAtZ(L, M, S, 2);
  const sd3n = valueAtZ(L, M, S, -3);
  const sd2n = valueAtZ(L, M, S, -2);
  return z > 3 ? 3 + (y - sd3) / (sd3 - sd2) : -3 + (y - sd3n) / (sd2n - sd3n);
}

export type Indicator = "hfa" | "wfa" | "wfh" | "bfa";

/**
 * Permenkes 2/2020, Bab II: length (lying) is used up to 24 months, height (standing) above 24.
 * Length measured standing at 0-24 months gets +0.7 cm; height measured lying above 24 months gets -0.7 cm.
 */
export function correctHeight(ageMonths: number, heightCm: number, lying: boolean): number {
  if (ageMonths <= 24 && !lying) return Math.round((heightCm + 0.7) * 10) / 10;
  if (ageMonths > 24 && lying) return Math.round((heightCm - 0.7) * 10) / 10;
  return heightCm;
}

export function z(ind: Indicator, sex: Sex, ageMonths: number, y: number, heightCm?: number): number | null {
  let key: string;
  let x: number;
  if (ind === "wfh") {
    if (heightCm == null) return null;
    key = ageMonths <= 24 ? "wfl" : "wfh";
    x = Math.round(heightCm * 2) / 2;
  } else {
    key = ind;
    x = ageMonths;
  }
  const r = row(T[`${key}_${sex}`], x);
  if (!r) return null;
  return zscore(y, r[0], r[1], r[2], ind !== "hfa");
}

/** Curve values (SD -3..+3) for charting height-for-age or weight-for-age. */
export function curve(ind: "hfa" | "wfa", sex: Sex, zs: number[]) {
  const t = T[`${ind}_${sex}`];
  return zs.map((zv) => ({ z: zv, pts: t.map((r) => ({ x: r[0], y: valueAtZ(r[1], r[2], r[3], zv) })) }));
}

export type Level = "severe" | "moderate" | "ok" | "watch" | "high";
export interface Status {
  label: string;
  level: Level;
}

/** Cut-offs follow the Indonesian child anthropometry standard (Permenkes 2/2020), which uses WHO z-scores. */
export function statusHFA(zv: number): Status {
  if (zv < -3) return { label: "Sangat pendek", level: "severe" };
  if (zv < -2) return { label: "Pendek", level: "moderate" };
  if (zv <= 3) return { label: "Normal", level: "ok" };
  return { label: "Tinggi", level: "watch" };
}
export function statusWFA(zv: number): Status {
  if (zv < -3) return { label: "Berat badan sangat kurang", level: "severe" };
  if (zv < -2) return { label: "Berat badan kurang", level: "moderate" };
  if (zv <= 1) return { label: "Berat badan normal", level: "ok" };
  return { label: "Risiko berat badan lebih", level: "watch" };
}
export function statusWFH(zv: number): Status {
  if (zv < -3) return { label: "Gizi buruk", level: "severe" };
  if (zv < -2) return { label: "Gizi kurang", level: "moderate" };
  if (zv <= 1) return { label: "Gizi baik", level: "ok" };
  if (zv <= 2) return { label: "Berisiko gizi lebih", level: "watch" };
  if (zv <= 3) return { label: "Gizi lebih", level: "high" };
  return { label: "Obesitas", level: "high" };
}

export interface Assessment {
  hfa: number | null;
  wfa: number | null;
  wfh: number | null;
  bfa: number | null;
  sHfa: Status | null;
  sWfa: Status | null;
  sWfh: Status | null;
  sBfa: Status | null;
  bmi: number;
  stunted: boolean;
  severelyStunted: boolean;
}

/** `lying` is how length/height was measured; when omitted it is assumed to match the age rule (no correction). */
export function assess(sex: Sex, ageMonths: number, weightKg: number, rawHeightCm: number, lying?: boolean): Assessment {
  const heightCm = correctHeight(ageMonths, rawHeightCm, lying ?? ageMonths <= 24);
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  const bfa = z("bfa", sex, ageMonths, bmi);
  const hfa = z("hfa", sex, ageMonths, heightCm);
  const wfa = z("wfa", sex, ageMonths, weightKg);
  const wfh = z("wfh", sex, ageMonths, weightKg, heightCm);
  return {
    hfa,
    wfa,
    wfh,
    bfa,
    sBfa: bfa == null ? null : statusWFH(bfa),
    sHfa: hfa == null ? null : statusHFA(hfa),
    sWfa: wfa == null ? null : statusWFA(wfa),
    sWfh: wfh == null ? null : statusWFH(wfh),
    bmi,
    stunted: hfa != null && hfa < -2,
    severelyStunted: hfa != null && hfa < -3,
  };
}

/** Plausibility limits (WHO flags): reject entries that are almost certainly typos. */
export function plausible(ageMonths: number, weightKg: number, heightCm: number): string | null {
  if (ageMonths < 0 || ageMonths > 60) return "Usia harus 0 sampai 60 bulan.";
  if (weightKg < 1.5 || weightKg > 30) return "Berat badan di luar rentang wajar (1,5 sampai 30 kg). Cek lagi angkanya.";
  if (heightCm < 40 || heightCm > 125) return "Tinggi badan di luar rentang wajar (40 sampai 125 cm). Cek lagi angkanya.";
  return null;
}
