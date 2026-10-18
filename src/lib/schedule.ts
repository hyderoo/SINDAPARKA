import type { Child, Measurement } from "./types";
import { addMonths, ageInMonths, daysBetween } from "./age";

export interface Vaccine {
  month: number;
  name: string;
}
/** Condensed basic immunization schedule. Always check the child's KIA book. */
export const VACCINES: Vaccine[] = [
  { month: 0, name: "Hepatitis B (HB-0)" },
  { month: 1, name: "BCG dan Polio tetes 1" },
  { month: 2, name: "DPT-HB-Hib 1 dan Polio 2" },
  { month: 3, name: "DPT-HB-Hib 2 dan Polio 3" },
  { month: 4, name: "DPT-HB-Hib 3, Polio 4 dan IPV" },
  { month: 9, name: "Campak-Rubela" },
  { month: 18, name: "DPT-HB-Hib lanjutan dan Campak-Rubela lanjutan" },
];

export interface Reminder {
  childId: string;
  kind: "kunjungan" | "imunisasi" | "vitamin";
  title: string;
  due: string;
  overdue: boolean;
  daysLeft: number;
}

export function lastVisit(ms: Measurement[]): Measurement | undefined {
  return ms.reduce<Measurement | undefined>((a, m) => (!a || m.date > a.date ? m : a), undefined);
}

export function remindersFor(child: Child, ms: Measurement[], today: string): Reminder[] {
  const out: Reminder[] = [];
  const lv = lastVisit(ms);
  const age = ageInMonths(child.birth, today);
  if (lv) {
    const due = addMonths(lv.date, 1);
    const daysLeft = daysBetween(today, due);
    out.push({ childId: child.id, kind: "kunjungan", title: "Penimbangan dan pengukuran bulanan", due, overdue: daysLeft < 0, daysLeft });
  }
  const next = VACCINES.find((v) => v.month >= age) ?? null;
  const prev = [...VACCINES].reverse().find((v) => v.month < age);
  if (next && next.month - age <= 1) {
    const due = addMonths(child.birth, next.month);
    out.push({ childId: child.id, kind: "imunisasi", title: next.name, due, overdue: false, daysLeft: daysBetween(today, due) });
  } else if (prev && age - prev.month === 0) {
    /* no-op: covered by next */
  }
  // vitamin A: Feb and Aug campaign months for age 6-59 months
  if (age >= 6 && age <= 59) {
    const t = new Date(today + "T00:00:00");
    const m = t.getMonth();
    const y = t.getFullYear();
    const target = m <= 1 ? `${y}-02-01` : m <= 7 ? `${y}-08-01` : `${y + 1}-02-01`;
    const dl = daysBetween(today, target);
    if (dl <= 45) out.push({ childId: child.id, kind: "vitamin", title: "Vitamin A bulan " + (target.slice(5, 7) === "02" ? "Februari" : "Agustus"), due: target, overdue: false, daysLeft: dl });
  }
  return out;
}
