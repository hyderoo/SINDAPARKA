import { describe, expect, it } from "vitest";
import { assess, correctHeight, curve, statusHFA, statusWFH, z } from "../who";
import { ageInMonths, addMonths } from "../age";

describe("WHO z-scores", () => {
  it("is ~0 at the published median and ~-2 / ~+2 at the SD marks", () => {
    // Published WHO boys length-for-age, 12 months: SD0 75.7, SD2neg 71.0, SD2 80.5
    expect(Math.abs(z("hfa", "L", 12, 75.7)!)).toBeLessThan(0.05);
    expect(z("hfa", "L", 12, 71.0)!).toBeCloseTo(-2, 1);
    expect(z("hfa", "L", 12, 80.5)!).toBeCloseTo(2, 1);
  });
  it("matches the table curves at every integer SD", () => {
    for (const sex of ["L", "P"] as const) {
      for (const zs of [-3, -2, 0, 2, 3]) {
        const c = curve("hfa", sex, [zs])[0].pts;
        for (const m of [0, 6, 18, 30, 59]) expect(z("hfa", sex, m, c[m].y)!).toBeCloseTo(zs, 3);
      }
    }
  });
  it("uses weight-for-length under 24 months and weight-for-height after", () => {
    expect(z("wfh", "P", 12, 9, 75)).not.toBeNull();
    expect(z("wfh", "P", 30, 12.5, 90)).not.toBeNull();
    expect(z("wfh", "P", 12, 9)).toBeNull();
  });
  it("returns null outside the table range", () => {
    expect(z("hfa", "L", 61, 100)).toBeNull();
    expect(z("wfh", "L", 20, 5, 30)).toBeNull();
  });
});

describe("Permenkes 2/2020 measurement rules", () => {
  it("corrects by 0.7 cm when the measuring position does not match the age", () => {
    expect(correctHeight(12, 75, true)).toBe(75);
    expect(correctHeight(12, 75, false)).toBe(75.7);
    expect(correctHeight(30, 90, false)).toBe(90);
    expect(correctHeight(30, 90, true)).toBe(89.3);
  });
  it("uses length tables up to and including 24 months, height tables after", () => {
    // WHO boys 24 months: length (lying) median 87.8, height (standing) median 87.1
    expect(Math.abs(z("hfa", "L", 24, 87.8161)!)).toBeLessThan(0.01);
    expect(Math.abs(z("hfa", "L", 25, 87.9720)!)).toBeLessThan(0.01);
  });
  it("returns a BMI-for-age z-score for 0-60 months", () => {
    const a = assess("P", 18, 10.5, 80);
    expect(a.bfa).not.toBeNull();
    expect(a.sBfa).not.toBeNull();
  });
});

describe("classification (Permenkes 2/2020 cut-offs)", () => {
  it("height-for-age", () => {
    expect(statusHFA(-3.01).label).toBe("Sangat pendek");
    expect(statusHFA(-3).label).toBe("Pendek");
    expect(statusHFA(-2.01).label).toBe("Pendek");
    expect(statusHFA(-2).label).toBe("Normal");
  });
  it("weight-for-height", () => {
    expect(statusWFH(-3.5).label).toBe("Gizi buruk");
    expect(statusWFH(0).label).toBe("Gizi baik");
    expect(statusWFH(1.5).label).toBe("Berisiko gizi lebih");
    expect(statusWFH(3.5).label).toBe("Obesitas");
  });
  it("flags a clearly stunted child", () => {
    const a = assess("L", 24, 10, 78);
    expect(a.stunted).toBe(true);
  });
});

describe("age helpers", () => {
  it("counts whole months", () => {
    expect(ageInMonths("2024-01-31", "2024-02-29")).toBe(0);
    expect(ageInMonths("2024-01-15", "2025-01-15")).toBe(12);
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });
});
