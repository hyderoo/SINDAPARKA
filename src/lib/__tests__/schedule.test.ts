import { describe, expect, it } from "vitest";
import { nextPosyanduDay, remindersFor } from "../schedule";
import type { Child } from "../types";

const kid: Child = { id: "c", name: "A", sex: "L", birth: "2025-12-05", posyandu: "P", posyanduId: "p", guardian: "-" };
const base = { given: new Set<string>(), endemic: false, visitDay: null as number | null };
const imm = (today: string, o = base) => remindersFor(kid, [], today, o).find((r) => r.kind === "imunisasi");

describe("schedule", () => {
  it("hides endemic-only Japanese Encephalitis unless enabled", () => {
    const done = new Set(["mr1", "ipv2"]);
    expect(imm("2026-10-19", { ...base, given: done })).toBeUndefined();
    expect(imm("2026-10-19", { ...base, given: done, endemic: true })?.title).toContain("Japanese");
  });
  it("does not remind about a dose already recorded", () => {
    expect(imm("2026-09-10")?.title).toContain("Campak-Rubela 1");
    expect(imm("2026-09-10", { ...base, given: new Set(["mr1", "ipv2"]) })).toBeUndefined();
  });
  it("does not nag about gaps older than 60 days", () => {
    expect(imm("2027-09-01")).toBeUndefined();
  });
  it("monthly visit follows the posyandu day, clamped to month length", () => {
    const m = [{ id: "m", childId: "c", date: "2026-01-20", weight: 9, height: 70 }];
    expect(remindersFor(kid, m, "2026-02-01", { ...base, visitDay: 15 }).find((r) => r.kind === "kunjungan")?.due).toBe("2026-02-15");
    expect(nextPosyanduDay("2026-01-20", 31)).toBe("2026-02-28");
  });
});
