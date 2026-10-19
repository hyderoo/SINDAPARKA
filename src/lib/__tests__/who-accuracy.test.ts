import { describe, expect, it } from "vitest";
import { z, type Indicator, type Sex } from "../who";
import who from "../who.json";
import fixture from "./who-official.fixture.json";

/**
 * Accuracy check of the WHO 2006 LMS implementation against the OFFICIAL WHO Child
 * Growth Standards z-score tables (downloaded from cdn.who.int on 2026-10-19, URLs in
 * the fixture file). The official tables are independent ground truth: they carry the
 * published L, M, S values and the published measurements at every SD from -3 to +3.
 *
 * Three layers:
 *  1. The embedded LMS constants must equal the official published L, M, S.
 *  2. Feeding the official printed SD boundary values into z() must give back that SD
 *     (within the rounding of the printed tables: 0.1 cm / 0.1 kg).
 *  3. Exact roundtrip of the LMS formula at every row, plus WHO's restricted-tail
 *     rule for weight-based indicators beyond |z| = 3.
 *
 * BFA (BMI-for-age) official tables are JS-linked on who.int and could not be fetched
 * programmatically; bfa uses the same verified code path and is covered by layer 3.
 */

type Row = { x: number; L: number; M: number; S: number; sd: number[] };
const OFF = fixture.tables as unknown as Record<string, Row[]>;
const EMB = who as unknown as Record<string, [number, number, number, number][]>;
const ZS = [-3, -2, -1, 0, 1, 2, 3];

const valueAtZ = (L: number, M: number, S: number, zv: number) =>
  L === 0 ? M * Math.exp(S * zv) : M * Math.pow(1 + L * S * zv, 1 / L);

/** (embeddedKey, officialKey, minX, maxX, indicator, sex, isWeight, ageMonths for table selection) */
const MAP: [string, string, number, number, Indicator, Sex, boolean, number][] = [
  // Permenkes 2/2020: length (lying) up to 24 months, height (standing) above 24 -
  // so the embedded hfa table is lfa 0..24 joined with hfa 25..60.
  ["hfa_L", "lfa_L", 0, 24, "hfa", "L", false, 12],
  ["hfa_L", "hfa_L", 25, 60, "hfa", "L", false, 36],
  ["hfa_P", "lfa_P", 0, 24, "hfa", "P", false, 12],
  ["hfa_P", "hfa_P", 25, 60, "hfa", "P", false, 36],
  ["wfa_L", "wfa_L", 0, 60, "wfa", "L", true, 12],
  ["wfa_P", "wfa_P", 0, 60, "wfa", "P", true, 12],
  ["wfl_L", "wfl_L", 45, 110, "wfh", "L", true, 12],
  ["wfl_P", "wfl_P", 45, 110, "wfh", "P", true, 12],
  ["wfh_L", "wfh_L", 65, 120, "wfh", "L", true, 36],
  ["wfh_P", "wfh_P", 65, 120, "wfh", "P", true, 36],
];

describe("WHO 2006 LMS tables vs official cdn.who.int publications", () => {
  it("embedded L, M, S equal the official published values", () => {
    let checked = 0;
    const misses: string[] = [];
    for (const [embKey, offKey, minX, maxX] of MAP) {
      const emb = new Map(EMB[embKey].map((r) => [r[0], r]));
      for (const o of OFF[offKey]) {
        if (o.x < minX || o.x > maxX) continue;
        const e = emb.get(o.x);
        checked++;
        if (!e) { misses.push(`${embKey}@${o.x}: missing row`); continue; }
        if (Math.abs(e[1] - o.L) > 1e-4 || Math.abs(e[2] - o.M) > 5e-4 || Math.abs(e[3] - o.S) > 1e-5) {
          misses.push(`${embKey}@${o.x}: embedded L=${e[1]} M=${e[2]} S=${e[3]} vs official L=${o.L} M=${o.M} S=${o.S}`);
        }
      }
    }
    expect(checked).toBeGreaterThan(600);
    expect(misses).toEqual([]);
  });

  it("z() reproduces the official printed SD boundary values", () => {
    let checked = 0;
    let worst = 0;
    let worstAt = "";
    const misses: string[] = [];
    for (const [, offKey, minX, maxX, ind, sex, , age] of MAP) {
      const lenBased = offKey.startsWith("l") || offKey.startsWith("h");
      const tol = lenBased ? 0.06 : 0.25; // printed tables round to 0.1 cm / 0.1 kg
      for (const o of OFF[offKey]) {
        if (o.x < minX || o.x > maxX) continue;
        for (let i = 0; i < ZS.length; i++) {
          const got = ind === "wfh" ? z(ind, sex, age, o.sd[i], o.x) : z(ind, sex, o.x, o.sd[i]);
          checked++;
          if (got == null) { misses.push(`${offKey}@${o.x} z=${ZS[i]}: null`); continue; }
          const d = Math.abs(got - ZS[i]);
          if (d > worst) { worst = d; worstAt = `${offKey}@${o.x} z=${ZS[i]}`; }
          if (d > tol) misses.push(`${offKey}@${o.x} z=${ZS[i]}: got ${got.toFixed(3)}`);
        }
      }
    }
    console.log(`    SD anchors checked: ${checked}, worst |deviation| ${worst.toFixed(3)} at ${worstAt}`);
    expect(checked).toBeGreaterThan(4500);
    expect(misses).toEqual([]);
  });

  it("LMS roundtrip is exact for every row and z in [-3..3]", () => {
    let checked = 0;
    for (const [, offKey, minX, maxX, ind, sex, , age] of MAP) {
      for (const o of OFF[offKey]) {
        if (o.x < minX || o.x > maxX) continue;
        for (const zv of [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3]) {
          const y = valueAtZ(o.L, o.M, o.S, zv);
          const got = ind === "wfh" ? z(ind, sex, age, y, o.x) : z(ind, sex, o.x, y);
          checked++;
          expect(got).not.toBeNull();
          expect(Math.abs((got as number) - zv)).toBeLessThan(1e-9);
        }
      }
    }
    expect(checked).toBeGreaterThan(8000);
  });

  it("restricted tails follow the WHO 2006 rule for weight indicators", () => {
    // WHO: beyond |z| = 3, z is extrapolated linearly using the SD2-SD3 gap.
    for (const key of ["wfa_L", "wfa_P"] as const) {
      const sex = key.endsWith("_L") ? "L" as const : "P" as const;
      const o = OFF[key][10]; // an arbitrary mid row
      const sd3 = valueAtZ(o.L, o.M, o.S, 3);
      const sd2 = valueAtZ(o.L, o.M, o.S, 2);
      const sd3n = valueAtZ(o.L, o.M, o.S, -3);
      const sd2n = valueAtZ(o.L, o.M, o.S, -2);
      const up = z("wfa", sex, o.x, sd3 + (sd3 - sd2)) as number;
      const dn = z("wfa", sex, o.x, sd3n - (sd2n - sd3n)) as number;
      expect(Math.abs(up - 4)).toBeLessThan(1e-9);
      expect(Math.abs(dn + 4)).toBeLessThan(1e-9);
    }
  });
});
