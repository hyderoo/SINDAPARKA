import type { Child, Measurement } from "./types";
import { assess, type Assessment } from "./who";
import { ageInMonths } from "./age";

export interface Point {
  m: Measurement;
  age: number;
  a: Assessment;
}
export function series(child: Child, ms: Measurement[]): Point[] {
  return ms
    .filter((m) => m.childId === child.id)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => {
      const age = ageInMonths(child.birth, m.date);
      return { m, age, a: assess(child.sex, age, m.weight, m.height, m.lying) };
    });
}
export type Trend = "falling" | "stable" | "rising";
/** Falling = height z-score lost 0.25 or more across the last 4 visits (needs 4 points). */
export function trendOf(pts: Point[]): Trend {
  const z = pts.map((p) => p.a.hfa).filter((v): v is number => v != null);
  if (z.length < 4) return "stable";
  const d = z[z.length - 1] - z[z.length - 4];
  return d <= -0.25 ? "falling" : d >= 0.25 ? "rising" : "stable";
}
export interface Row {
  child: Child;
  pts: Point[];
  last?: Point;
  trend: Trend;
}
export function rows(children: Child[], ms: Measurement[]): Row[] {
  const by = new Map<string, Measurement[]>();
  ms.forEach((m) => by.set(m.childId, [...(by.get(m.childId) ?? []), m]));
  return children.map((child) => {
    const pts = series(child, by.get(child.id) ?? []);
    return { child, pts, last: pts[pts.length - 1], trend: trendOf(pts) };
  });
}
export function priority(r: Row): number {
  const a = r.last?.a;
  if (!a) return 0;
  let s = 0;
  if (a.severelyStunted) s += 100;
  else if (a.stunted) s += 60;
  if (a.sWfh?.level === "severe") s += 80;
  else if (a.sWfh?.level === "moderate") s += 40;
  if (r.trend === "falling") s += 25;
  return s;
}
export function prevalence(rs: Row[]) {
  const measured = rs.filter((r) => r.last?.a.hfa != null);
  const stunted = measured.filter((r) => r.last!.a.stunted).length;
  const severe = measured.filter((r) => r.last!.a.severelyStunted).length;
  return { n: measured.length, stunted, severe, pct: measured.length ? (stunted / measured.length) * 100 : 0 };
}
