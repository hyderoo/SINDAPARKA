import type { Child, Measurement } from "./types";
import { addMonths, ageInMonths, daysBetween } from "./age";

export interface Vaccine {
  month: number;
  name: string;
}
/** Routine infant and toddler schedule as published by Kemenkes (ayosehat.kemkes.go.id, "Jadwal Pemberian Imunisasi Rutin Lengkap"). Always check the child's KIA book. */
export const VACCINES: Vaccine[] = [
  { month: 0, name: "Hepatitis B (HB-0)" },
  { month: 1, name: "BCG dan Polio tetes 1" },
  { month: 2, name: "DPT-HB-Hib 1, Polio tetes 2, PCV 1, Rotavirus 1" },
  { month: 3, name: "DPT-HB-Hib 2, Polio tetes 3, PCV 2, Rotavirus 2" },
  { month: 4, name: "DPT-HB-Hib 3, Polio tetes 4, Polio suntik (IPV) 1, Rotavirus 3" },
  { month: 9, name: "Campak-Rubela 1 dan Polio suntik (IPV) 2" },
  { month: 10, name: "Japanese Encephalitis (hanya wilayah endemis)" },
  { month: 12, name: "PCV 3" },
  { month: 18, name: "DPT-HB-Hib 4 dan Campak-Rubela 2" },
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
    if (dl <= 45) out.push({ childId: child.id, kind: "vitamin", title: (age < 12 ? "Vitamin A biru (100.000 IU)" : "Vitamin A merah (200.000 IU)") + ", bulan " + (target.slice(5, 7) === "02" ? "Februari" : "Agustus"), due: target, overdue: false, daysLeft: dl });
  }
  return out;
}
