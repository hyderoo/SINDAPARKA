"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { actions, useStore } from "@/lib/store";
import type { AuditEntry } from "@/lib/types";
import { fmtDate } from "@/lib/age";
import { Msg } from "@/components/Auth";
import { EmptyState } from "@/components/ui";

const TABLE_LABEL: Record<string, string> = { children: "Anak", measurements: "Pengukuran", immunizations: "Imunisasi" };
const ACTION_LABEL: Record<string, string> = { INSERT: "Tambah", UPDATE: "Ubah", DELETE: "Hapus" };
const ACTION_CHIP: Record<string, string> = { INSERT: "chip-ok", UPDATE: "chip-watch", DELETE: "chip-severe" };

const FIELD_LABEL: Record<string, string> = {
  name: "Nama", sex: "Jenis kelamin", birth_date: "Tanggal lahir", guardian_name: "Nama wali",
  address_note: "Catatan alamat", consent_at: "Tanggal persetujuan", posyandu_id: "Posyandu",
  deleted_at: "Diarsipkan pada", measured_on: "Tanggal ukur", weight_kg: "Berat (kg)",
  length_height_cm: "Panjang/tinggi (cm)", lying: "Cara ukur", note: "Catatan",
  vaccine: "Vaksin", given_on: "Tanggal diberikan",
  z_hfa: "Z TB/U", z_wfa: "Z BB/U", z_wfh: "Z BB/TB", z_bfa: "Z IMT/U",
};
const SKIP = new Set(["id", "created_at", "created_by", "rules_version", "consent_recorded_by"]);

const fmtVal = (k: string, v: unknown, posName: (id: string) => string): string => {
  if (v == null || v === "") return "kosong";
  if (k === "sex") return v === "L" ? "Laki-laki" : "Perempuan";
  if (k === "lying") return v ? "Berbaring" : "Berdiri";
  if (k === "posyandu_id") return posName(String(v));
  if (typeof v === "number") return String(v).replace(".", ",");
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return fmtDate(s);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return fmtDate(s.slice(0, 10));
  return s;
};

function Changes({ e, posName }: { e: AuditEntry; posName: (id: string) => string }) {
  const rows: [string, unknown, unknown][] = [];
  if (e.action === "UPDATE") {
    Object.keys(e.newData ?? {}).filter((k) => !SKIP.has(k)).forEach((k) => rows.push([k, e.oldData?.[k], e.newData?.[k]]));
  } else if (e.action === "INSERT") {
    Object.keys(e.newData ?? {}).filter((k) => !SKIP.has(k)).forEach((k) => rows.push([k, undefined, e.newData?.[k]]));
  } else {
    Object.keys(e.oldData ?? {}).filter((k) => !SKIP.has(k)).forEach((k) => rows.push([k, e.oldData?.[k], undefined]));
  }
  const shown = rows.slice(0, 8);
  return (
    <ul className="mt-2 space-y-1 text-sm">
      {shown.map(([k, o, n]) => (
        <li key={k}>
          <span className="font-semibold">{FIELD_LABEL[k] ?? k}:</span>{" "}
          {e.action === "INSERT" ? fmtVal(k, n, posName) : e.action === "DELETE" ? fmtVal(k, o, posName) : (
            <>{fmtVal(k, o, posName)} <span aria-hidden>&rarr;</span> <b>{fmtVal(k, n, posName)}</b></>
          )}
        </li>
      ))}
      {rows.length > shown.length && <li className="text-mute">dan {rows.length - shown.length} kolom lainnya</li>}
    </ul>
  );
}

const fmtAt = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso)).replace(".", ":") + " WIB";

export default function Audit() {
  const s = useStore();
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [actors, setActors] = useState<Map<string, string>>(new Map());
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const isAdmin = s?.role === "admin";

  const load = useCallback(async (before?: number) => {
    try {
      const batch = await actions.listAudit(before);
      setDone(batch.length < 50);
      setEntries((prev) => (before == null ? batch : [...(prev ?? []), ...batch]));
    } catch (e) {
      setErr(String((e as { message?: string }).message ?? e));
    }
  }, []);
  const loadMore = async () => {
    if (!entries?.length) return;
    setBusy(true);
    await load(entries[entries.length - 1].id);
    setBusy(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(() => {
      load();
      actions.listProfiles().then((ps) => setActors(new Map(ps.map((p) => [p.id, p.fullName || "Tanpa nama"])))).catch(() => {});
    }, 0);
    return () => clearTimeout(t);
  }, [isAdmin, load]);

  const shown = useMemo(() => (entries ?? []).filter((e) => filter === "all" || e.table === filter), [entries, filter]);
  if (!s) return null;
  if (!isAdmin) return <Msg kind="err">Halaman ini hanya untuk admin.</Msg>;
  const posName = (id: string) => s.posyanduList.find((x) => x.id === id)?.name ?? id.slice(0, 8);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold">Catatan perubahan data</h1>
      <p className="text-sm text-mute">
        Setiap penambahan, perubahan, dan pengarsipan data anak, pengukuran, dan imunisasi tercatat otomatis dengan nilai sebelum dan sesudahnya.
        Catatan ini tidak bisa diubah atau dihapus oleh siapa pun, dan hanya bisa dibaca admin.
      </p>
      <div className="flex flex-wrap gap-2">
        {[["all", "Semua"], ["children", "Anak"], ["measurements", "Pengukuran"], ["immunizations", "Imunisasi"]].map(([k, l]) => (
          <button key={k} className={`btn ${filter === k ? "btn-primary" : "btn-ghost"} !min-h-10 text-sm`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      {err && <Msg kind="err">{err}</Msg>}
      {entries === null && !err && <p className="text-mute">Memuat...</p>}
      {entries !== null && shown.length === 0 && (
        <EmptyState icon="check" title="Belum ada catatan" text="Catatan muncul setelah ada data anak, pengukuran, atau imunisasi yang ditambah atau diubah." />
      )}
      <ul className="grid gap-3">
        {shown.map((e) => (
          <li key={e.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={`chip ${ACTION_CHIP[e.action] ?? "chip-watch"}`}>{ACTION_LABEL[e.action] ?? e.action}</span>
              <span className="font-bold">{TABLE_LABEL[e.table] ?? e.table}</span>
              <span className="text-xs text-mute">{fmtAt(e.at)} · oleh {e.actor ? actors.get(e.actor) ?? "Pengguna lain" : "Sistem"}</span>
            </div>
            <Changes e={e} posName={posName} />
          </li>
        ))}
      </ul>
      {!done && entries !== null && (
        <button className="btn btn-ghost w-full" disabled={busy} onClick={loadMore}>
          {busy ? "Memuat..." : "Muat catatan lebih lama"}
        </button>
      )}
    </div>
  );
}
