import type { Child, Immunization, Measurement, Posyandu, Puskesmas } from "./types";
import { addMonths, ageInMonths, daysBetween } from "./age";

export interface Dose {
  code: string;
  month: number; // age in months when due
  name: string;
  endemic?: boolean; // only for endemic areas; hidden unless an admin enables it
}
/** Routine infant and toddler schedule as published by Kemenkes (ayosehat.kemkes.go.id, "Jadwal Pemberian Imunisasi Rutin Lengkap"). Always check the child's KIA book. */
export const DOSES: Dose[] = [
  { code: "hb0", month: 0, name: "Hepatitis B (HB-0)" },
  { code: "bcg", month: 1, name: "BCG" },
  { code: "polio1", month: 1, name: "Polio tetes 1" },
  { code: "dpt1", month: 2, name: "DPT-HB-Hib 1" },
  { code: "polio2", month: 2, name: "Polio tetes 2" },
  { code: "pcv1", month: 2, name: "PCV 1" },
  { code: "rota1", month: 2, name: "Rotavirus 1" },
  { code: "dpt2", month: 3, name: "DPT-HB-Hib 2" },
  { code: "polio3", month: 3, name: "Polio tetes 3" },
  { code: "pcv2", month: 3, name: "PCV 2" },
  { code: "rota2", month: 3, name: "Rotavirus 2" },
  { code: "dpt3", month: 4, name: "DPT-HB-Hib 3" },
  { code: "polio4", month: 4, name: "Polio tetes 4" },
  { code: "ipv1", month: 4, name: "Polio suntik (IPV) 1" },
  { code: "rota3", month: 4, name: "Rotavirus 3" },
  { code: "mr1", month: 9, name: "Campak-Rubela 1" },
  { code: "ipv2", month: 9, name: "Polio suntik (IPV) 2" },
  { code: "je", month: 10, name: "Japanese Encephalitis", endemic: true },
  { code: "pcv3", month: 12, name: "PCV 3" },
  { code: "dpt4", month: 18, name: "DPT-HB-Hib 4" },
  { code: "mr2", month: 18, name: "Campak-Rubela 2" },
];
export const dosesFor = (endemic: boolean) => DOSES.filter((d) => endemic || !d.endemic);

export interface ReminderOpts {
  given: Set<string>; // dose codes already recorded for this child
  endemic: boolean; // puskesmas enabled endemic-only vaccines
  visitDay?: number | null; // posyandu day of the month
}

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

const pad = (n: number) => String(n).padStart(2, "0");
/** Date of the posyandu day in the month after `iso`, clamped to the month length. */
export function nextPosyanduDay(iso: string, day: number): string {
  const nm = addMonths(iso.slice(0, 7) + "-01", 1);
  const [y, m] = nm.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${y}-${pad(m)}-${pad(Math.min(day, last))}`;
}

export function remindersFor(child: Child, ms: Measurement[], today: string, opts: ReminderOpts): Reminder[] {
  const out: Reminder[] = [];
  const lv = lastVisit(ms);
  const age = ageInMonths(child.birth, today);
  if (lv) {
    const due = opts.visitDay ? nextPosyanduDay(lv.date, opts.visitDay) : addMonths(lv.date, 1);
    const daysLeft = daysBetween(today, due);
    out.push({ childId: child.id, kind: "kunjungan", title: opts.visitDay ? `Penimbangan di posyandu (tanggal ${opts.visitDay})` : "Penimbangan dan pengukuran bulanan", due, overdue: daysLeft < 0, daysLeft });
  }
  // Immunization: only doses not yet recorded, due within 14 days or up to 60 days late. Older gaps are not guessed
  // (history before the app was used is unknown); they show as "belum dicatat" on the child page instead.
  const pending = dosesFor(opts.endemic).filter((d) => !opts.given.has(d.code)).map((d) => ({ d, due: addMonths(child.birth, d.month) }))
    .map((x) => ({ ...x, daysLeft: daysBetween(today, x.due) }))
    .filter((x) => x.daysLeft <= 14 && x.daysLeft >= -60);
  if (pending.length) {
    const first = pending.reduce((a, b) => (b.daysLeft < a.daysLeft ? b : a));
    const grp = pending.filter((x) => x.d.month === first.d.month);
    out.push({ childId: child.id, kind: "imunisasi", title: `Imunisasi usia ${first.d.month} bln: ${grp.map((x) => x.d.name).join(", ")}`, due: first.due, overdue: first.daysLeft < 0, daysLeft: first.daysLeft });
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

export function optsFor(s: { immunizations: Immunization[]; posyanduList: Posyandu[]; puskesmasList: Puskesmas[] }, child: Child): ReminderOpts {
  const pos = s.posyanduList.find((p) => p.id === child.posyanduId);
  const pk = s.puskesmasList.find((p) => p.id === pos?.puskesmasId);
  return { given: new Set(s.immunizations.filter((i) => i.childId === child.id).map((i) => i.vaccine)), endemic: !!pk?.endemicVaccines, visitDay: pos?.visitDay ?? null };
}
