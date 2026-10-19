import type { Row } from "./analytics";
import { ageInMonths, fmtDate, fmtMonthYear, todayISO } from "./age";
import type { Status } from "./who";

/* Format ringkas SINDAPARKA. This is a summary layout built for this app. It is NOT an official Kemenkes,
   SKDN, LB3 or e-PPGBM form. Column ideas follow the common posyandu/e-PPGBM per-child fields
   (name, sex, birth date, measurement date, weight, length/height, z-scores, status). */

export interface ChildLine {
  no: number;
  posyandu: string;
  name: string;
  sex: "L" | "P";
  birth: string;
  date: string;
  age: number;
  weight: number;
  height: number;
  posture: "Berbaring" | "Berdiri";
  zWfa: number | null;
  zHfa: number | null;
  zWfh: number | null;
  sWfa: Status | null;
  sHfa: Status | null;
  sWfh: Status | null;
  falling: boolean;
}
export interface SumLine { p: string; terdaftar: number; hadir: number; pendek: number; sangat: number; bbKurang: number; gizi: number; lebih: number; falling: number }
export interface Report {
  month: string;
  periodLabel: string;
  puskesmas: string;
  posyanduScope: string;
  generated: string;
  sums: SumLine[];
  total: SumLine;
  kids: ChildLine[];
}

export const pct = (n: number, d: number) => (d ? ((n / d) * 100).toFixed(1).replace(".", ",") + "%" : "-");
export const pctNum = (n: number, d: number) => (d ? n / d : null);

export function buildReport(opts: { rows: Row[]; posyanduNames: string[]; month: string; puskesmas: string; scopeLabel: string; todayIso: string }): Report {
  const { rows, posyanduNames, month, puskesmas, scopeLabel, todayIso } = opts;
  const kids: ChildLine[] = [];
  const sums: SumLine[] = posyanduNames.map((p) => {
    const mine = rows.filter((r) => r.child.posyandu === p);
    const cur = mine
      .map((k) => ({ k, pt: k.pts.filter((x) => x.m.date.startsWith(month)).pop() }))
      .filter((x): x is { k: Row; pt: NonNullable<typeof x.pt> } => !!x.pt)
      .sort((a, b) => a.k.child.name.localeCompare(b.k.child.name));
    cur.forEach(({ k, pt }) =>
      kids.push({
        no: 0, posyandu: p, name: k.child.name, sex: k.child.sex, birth: k.child.birth, date: pt.m.date,
        age: ageInMonths(k.child.birth, pt.m.date), weight: pt.m.weight, height: pt.m.height,
        posture: (pt.m.lying ?? pt.age <= 24) ? "Berbaring" : "Berdiri",
        zWfa: pt.a.wfa, zHfa: pt.a.hfa, zWfh: pt.a.wfh, sWfa: pt.a.sWfa, sHfa: pt.a.sHfa, sWfh: pt.a.sWfh, falling: k.trend === "falling",
      }),
    );
    const c = (f: (a: (typeof cur)[number]["pt"]) => boolean) => cur.filter((x) => f(x.pt)).length;
    return {
      p, terdaftar: mine.length, hadir: cur.length,
      pendek: c((x) => x.a.hfa != null && x.a.hfa < -2 && x.a.hfa >= -3),
      sangat: c((x) => x.a.severelyStunted),
      bbKurang: c((x) => x.a.wfa != null && x.a.wfa < -2),
      gizi: c((x) => x.a.wfh != null && x.a.wfh < -2),
      lebih: c((x) => x.a.wfh != null && x.a.wfh > 2),
      falling: cur.filter((x) => x.k.trend === "falling").length,
    };
  });
  kids.forEach((k, i) => (k.no = i + 1));
  const total = sums.reduce((a, d) => ({ p: "TOTAL", terdaftar: a.terdaftar + d.terdaftar, hadir: a.hadir + d.hadir, pendek: a.pendek + d.pendek, sangat: a.sangat + d.sangat, bbKurang: a.bbKurang + d.bbKurang, gizi: a.gizi + d.gizi, lebih: a.lebih + d.lebih, falling: a.falling + d.falling }), { p: "TOTAL", terdaftar: 0, hadir: 0, pendek: 0, sangat: 0, bbKurang: 0, gizi: 0, lebih: 0, falling: 0 });
  return { month, periodLabel: fmtMonthYear(month + "-01"), puskesmas, posyanduScope: scopeLabel, generated: fmtDate(todayIso), sums, total, kids };
}

export const NOTE_TOOL = "SINDAPARKA adalah alat bantu skrining, bukan alat diagnosis. Keputusan klinis ada pada tenaga kesehatan.";
export const NOTE_FORMAT = "Format ringkas SINDAPARKA. Bukan formulir resmi (SKDN, LB3, e-PPGBM).";
export const NOTE_CONF = "RAHASIA: berisi data pribadi anak. Simpan dan bagikan hanya kepada pihak yang berwenang.";
export const NOTE_METHOD = "Setiap anak dihitung sekali, dari pengukuran terakhirnya di bulan ini. Klasifikasi mengikuti Permenkes 2/2020 (standar WHO 2006, 0 sampai 60 bulan). Pendek = TB/U di bawah -2 SD; sangat pendek = di bawah -3 SD.";

const LEVEL_FILL: Record<string, string> = { ok: "FFD9F2E0", watch: "FFFEF3CD", moderate: "FFFDEBD8", severe: "FFFCE4E2", high: "FFFCE4E2" };

const utcDate = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };

async function img(url: string): Promise<ArrayBuffer | null> {
  try { const r = await fetch(url); return r.ok ? await r.arrayBuffer() : null; } catch { return null; }
}

export async function buildXlsx(rep: Report): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "SINDAPARKA";
  wb.created = new Date();
  const BLUE = "FF0B63CE", INK = "FF1F2937", MUTE = "FF5F6B7A", LINE = "FFD5DBE3", SOFT = "FFEAF2FC";
  const thin = { style: "thin" as const, color: { argb: LINE } };
  const box = { top: thin, left: thin, bottom: thin, right: thin };
  const bk = await img("/logos/bkkbn.png");
  const ud = await img("/logos/undip.png");

  const addLogos = (ws: import("exceljs").Worksheet) => {
    if (bk) { const id = wb.addImage({ buffer: bk, extension: "png" }); ws.addImage(id, { tl: { col: 0.1, row: 0.1 }, ext: { width: 180, height: 48 } }); }
    if (ud) { const id = wb.addImage({ buffer: ud, extension: "png" }); ws.addImage(id, { tl: { col: 2.2, row: 0.1 }, ext: { width: 41, height: 48 } }); }
  };
  const title = (ws: import("exceljs").Worksheet, lastCol: number, sub: string) => {
    ws.getRow(1).height = 48;
    ws.mergeCells(2, 1, 2, lastCol);
    const t = ws.getCell(2, 1); t.value = "LAPORAN PENIMBANGAN BALITA"; t.font = { name: "Calibri", size: 16, bold: true, color: { argb: BLUE } };
    ws.mergeCells(3, 1, 3, lastCol);
    ws.getCell(3, 1).value = `${sub}  |  ${rep.periodLabel}`; ws.getCell(3, 1).font = { size: 11, bold: true, color: { argb: INK } };
    ws.mergeCells(4, 1, 4, lastCol);
    ws.getCell(4, 1).value = `Puskesmas: ${rep.puskesmas}   |   Posyandu: ${rep.posyanduScope}   |   Periode: ${rep.periodLabel}`; ws.getCell(4, 1).font = { size: 10, color: { argb: MUTE } };
    ws.mergeCells(5, 1, 5, lastCol);
    ws.getCell(5, 1).value = NOTE_FORMAT; ws.getCell(5, 1).font = { size: 9, italic: true, color: { argb: MUTE } };
  };
  const footer = (ws: import("exceljs").Worksheet, row: number, lastCol: number) => {
    [`Dibuat dari SINDAPARKA pada ${rep.generated}.`, NOTE_METHOD, NOTE_TOOL, NOTE_CONF].forEach((txt, i) => {
      ws.mergeCells(row + i, 1, row + i, lastCol);
      const c = ws.getCell(row + i, 1); c.value = txt; c.alignment = { wrapText: true, vertical: "top" };
      c.font = { size: 9, italic: i !== 3, bold: i === 3, color: { argb: i === 3 ? "FFB3261E" : MUTE } };
      ws.getRow(row + i).height = i === 1 ? 30 : 16;
    });
  };
  const head = (r: import("exceljs").Row) => r.eachCell((c) => { c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } }; c.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; c.border = box; });

  // Sheet 1: summary
  const s1 = wb.addWorksheet("Ringkasan", { views: [{ showGridLines: false }], pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  s1.columns = [{ width: 26 }, { width: 12 }, { width: 12 }, { width: 11 }, { width: 14 }, { width: 12 }, { width: 18 }, { width: 12 }, { width: 13 }, { width: 12 }];
  title(s1, 10, "Ringkasan bulanan");
  addLogos(s1);
  const T = rep.total;
  const kpi: [string, string | number][] = [["Balita terpantau (diukur bulan ini)", T.hadir], ["Prevalensi pendek (pendek + sangat pendek)", pct(T.pendek + T.sangat, T.hadir)], ["Sangat pendek (TB/U di bawah -3 SD)", T.sangat], ["Kurva tinggi turun", T.falling], ["Gizi kurang/buruk (BB/TB di bawah -2 SD)", T.gizi]];
  s1.getCell(7, 1).value = "Angka utama"; s1.getCell(7, 1).font = { bold: true, size: 12, color: { argb: INK } };
  kpi.forEach(([k, v], i) => {
    const r = 8 + i; s1.mergeCells(r, 1, r, 6); s1.mergeCells(r, 7, r, 8);
    const a = s1.getCell(r, 1), b = s1.getCell(r, 7);
    a.value = k; b.value = v; a.border = box; b.border = box; a.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SOFT } };
    b.font = { bold: true, size: 12, color: { argb: BLUE } }; b.alignment = { horizontal: "right" };
    s1.getCell(r, 6).border = box; s1.getCell(r, 8).border = box;
  });
  const hr = 15;
  s1.getCell(hr - 1, 1).value = "Per posyandu"; s1.getCell(hr - 1, 1).font = { bold: true, size: 12, color: { argb: INK } };
  const h = s1.getRow(hr); h.values = ["Posyandu", "Terdaftar", "Diukur", "Pendek", "Sangat pendek", "BB kurang", "Gizi kurang/buruk", "Gizi lebih", "Kurva turun", "% pendek"]; h.height = 32; head(h);
  [...rep.sums, rep.total].forEach((d, i) => {
    const r = s1.getRow(hr + 1 + i);
    r.values = [d.p, d.terdaftar, d.hadir, d.pendek, d.sangat, d.bbKurang, d.gizi, d.lebih, d.falling, pctNum(d.pendek + d.sangat, d.hadir) ?? "-"];
    r.eachCell((c, n) => { c.border = box; c.alignment = { horizontal: n === 1 ? "left" : "center" }; if (d.p === "TOTAL") { c.font = { bold: true }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SOFT } }; } });
    r.getCell(10).numFmt = "0.0%";
  });
  footer(s1, hr + rep.sums.length + 4, 10);

  // Sheet 2: per child
  const s2 = wb.addWorksheet("Data anak", { views: [{ state: "frozen", ySplit: 7, xSplit: 3, showGridLines: false }], pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "7:7" } });
  const cols = [["No", 5], ["Posyandu", 24], ["Nama anak", 26], ["JK", 5], ["Tanggal lahir", 13], ["Tanggal ukur", 13], ["Umur (bln)", 9], ["BB (kg)", 8], ["PB/TB (cm)", 10], ["Cara ukur", 11], ["Z BB/U", 9], ["Z TB/U", 9], ["Z BB/TB", 9], ["Status TB/U", 20], ["Status BB/U", 24], ["Status BB/TB", 22], ["Kurva turun", 11]] as const;
  s2.columns = cols.map(([, w]) => ({ width: w }));
  title(s2, cols.length, "Data per anak");
  addLogos(s2);
  const h2 = s2.getRow(7); h2.values = cols.map(([n]) => n); h2.height = 32; head(h2);
  rep.kids.forEach((k, i) => {
    const r = s2.getRow(8 + i);
    r.values = [k.no, k.posyandu, k.name, k.sex, utcDate(k.birth), utcDate(k.date), k.age, k.weight, k.height, k.posture, k.zWfa, k.zHfa, k.zWfh, k.sHfa?.label ?? "-", k.sWfa?.label ?? "-", k.sWfh?.label ?? "-", k.falling ? "Ya" : ""];
    r.eachCell((c, n) => { c.border = box; c.alignment = { horizontal: [2, 3, 14, 15, 16].includes(n) ? "left" : "center", vertical: "middle" }; });
    r.getCell(5).numFmt = "dd/mm/yyyy"; r.getCell(6).numFmt = "dd/mm/yyyy";
    r.getCell(8).numFmt = "0.0"; r.getCell(9).numFmt = "0.0";
    [11, 12, 13].forEach((n) => (r.getCell(n).numFmt = "0.00;-0.00;0.00"));
    ([[14, k.sHfa], [15, k.sWfa], [16, k.sWfh]] as const).forEach(([n, s]) => { if (s) r.getCell(n).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LEVEL_FILL[s.level] ?? "FFFFFFFF" } }; });
    if (k.falling) r.getCell(17).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LEVEL_FILL.watch } };
  });
  if (rep.kids.length) s2.autoFilter = { from: { row: 7, column: 1 }, to: { row: 7 + rep.kids.length, column: cols.length } };
  else { s2.mergeCells(8, 1, 8, cols.length); s2.getCell(8, 1).value = "Belum ada pengukuran pada periode ini."; s2.getCell(8, 1).font = { italic: true, color: { argb: MUTE } }; }
  footer(s2, 8 + Math.max(rep.kids.length, 1) + 1, cols.length);
  s2.headerFooter.oddFooter = "&LSINDAPARKA - RAHASIA&CHalaman &P dari &N&R&D";
  s1.headerFooter.oddFooter = "&LSINDAPARKA - RAHASIA&CHalaman &P dari &N&R&D";

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/* Generic child register ("register balita"): every registered child with their latest measurement.
   This is a generic SINDAPARKA layout, NOT the official puskesmas format (Sigizi, e-PPGBM, LB3).
   The exact format the puskesmas uses still needs confirmation from puskesmas staff. */
export const NOTE_REGISTER = "Register umum SINDAPARKA, bukan format resmi puskesmas (Sigizi/e-PPGBM/LB3). Konfirmasikan format yang dipakai ke petugas puskesmas.";

export async function buildRegisterXlsx(rows: Row[], meta: { puskesmas: string; scopeLabel: string }): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "SINDAPARKA";
  const BLUE = "FF0B63CE", INK = "FF1F2937", MUTE = "FF5F6B7A", LINE = "FFD5DBE3";
  const thin = { style: "thin" as const, color: { argb: LINE } };
  const box = { top: thin, left: thin, bottom: thin, right: thin };
  const ws = wb.addWorksheet("Register balita", { views: [{ state: "frozen", ySplit: 6, xSplit: 3, showGridLines: false }], pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "6:6" } });
  const cols = [["No", 5], ["Posyandu", 24], ["Nama anak", 28], ["JK", 5], ["Tanggal lahir", 13], ["Umur (bln)", 9], ["Nama orang tua/wali", 26], ["Tanggal ukur terakhir", 14], ["BB (kg)", 8], ["PB/TB (cm)", 10], ["Status TB/U", 20], ["Status BB/TB", 20], ["Kurva turun", 11]] as const;
  ws.columns = cols.map(([, w]) => ({ width: w }));
  ws.mergeCells(1, 1, 1, cols.length);
  const t = ws.getCell(1, 1); t.value = "REGISTER BALITA"; t.font = { name: "Calibri", size: 16, bold: true, color: { argb: BLUE } };
  ws.mergeCells(2, 1, 2, cols.length);
  ws.getCell(2, 1).value = `Puskesmas: ${meta.puskesmas}   |   Posyandu: ${meta.scopeLabel}   |   Per ${fmtDate(todayISO())}`; ws.getCell(2, 1).font = { size: 10, bold: true, color: { argb: INK } };
  ws.mergeCells(3, 1, 3, cols.length);
  ws.getCell(3, 1).value = NOTE_REGISTER; ws.getCell(3, 1).font = { size: 9, italic: true, color: { argb: MUTE } };
  ws.mergeCells(4, 1, 4, cols.length);
  ws.getCell(4, 1).value = "Semua anak terdaftar, diukur maupun belum. Umur dihitung sampai tanggal pembuatan berkas."; ws.getCell(4, 1).font = { size: 9, italic: true, color: { argb: MUTE } };
  const h = ws.getRow(6); h.values = cols.map(([n]) => n); h.height = 30;
  h.eachCell((c) => { c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } }; c.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; c.border = box; });
  const sorted = [...rows].sort((a, b) => a.child.posyandu.localeCompare(b.child.posyandu) || a.child.name.localeCompare(b.child.name));
  const today = todayISO();
  sorted.forEach((r, i) => {
    const pt = r.last;
    const row = ws.getRow(7 + i);
    row.values = [
      i + 1, r.child.posyandu, r.child.name, r.child.sex, utcDate(r.child.birth), ageInMonths(r.child.birth, today), r.child.guardian,
      pt ? utcDate(pt.m.date) : "belum diukur", pt?.m.weight ?? "-", pt?.m.height ?? "-",
      pt?.a.sHfa?.label ?? "-", pt?.a.sWfh?.label ?? "-", r.trend === "falling" ? "Ya" : "",
    ];
    row.eachCell((c, n) => { c.border = box; c.alignment = { horizontal: [2, 3, 7, 11, 12].includes(n) ? "left" : "center", vertical: "middle" }; });
    row.getCell(5).numFmt = "dd/mm/yyyy";
    if (pt) row.getCell(8).numFmt = "dd/mm/yyyy";
    ([[11, pt?.a.sHfa ?? null], [12, pt?.a.sWfh ?? null]] as const).forEach(([n, s]) => { if (s) row.getCell(n).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LEVEL_FILL[s.level] ?? "FFFFFFFF" } }; });
    if (r.trend === "falling") row.getCell(13).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LEVEL_FILL.watch } };
  });
  if (sorted.length) ws.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6 + sorted.length, column: cols.length } };
  const f0 = 7 + sorted.length + 1;
  [`Dibuat dari SINDAPARKA pada ${fmtDate(today)}.`, NOTE_METHOD, NOTE_TOOL, NOTE_CONF].forEach((txt, i) => {
    ws.mergeCells(f0 + i, 1, f0 + i, cols.length);
    const c = ws.getCell(f0 + i, 1); c.value = txt; c.alignment = { wrapText: true, vertical: "top" };
    c.font = { size: 9, italic: i !== 3, bold: i === 3, color: { argb: i === 3 ? "FFB3261E" : MUTE } };
  });
  ws.headerFooter.oddFooter = "&LSINDAPARKA - RAHASIA&CHalaman &P dari &N&R&D";
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
