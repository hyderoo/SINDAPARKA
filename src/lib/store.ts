"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { AccountStatus, AuditEntry, Child, Immunization, Measurement, Posyandu, Profile, Puskesmas, Role } from "./types";
import { supabase } from "./supabase";
import { assess } from "./who";
import { ageInMonths } from "./age";

interface State {
  ready: boolean; // first session check done
  loading: boolean;
  loaded: boolean; // first full data load finished
  error: string | null;
  userId: string | null;
  email: string | null;
  fullName: string;
  role: Role | null;
  status: AccountStatus | null;
  posyandu: string; // own posyandu name for kader, "all" otherwise
  posyanduId: string | null;
  posyanduList: Posyandu[];
  puskesmasList: Puskesmas[];
  children: Child[];
  measurements: Measurement[];
  immunizations: Immunization[];
  lang: "id" | "en";
  queue: QueuedEntry[];
}

/** One penimbangan recorded while offline. Carries the child's sex and birth date so z-scores
    can be computed at send time, and a client-made child id when the child is new.
    Stored on this device only until sent; visible and deletable in the app. */
export interface QueuedEntry {
  id: string; // queue entry id
  queuedAt: string;
  childId: string; // existing child id, or the client-made id of the new child
  isNewChild: boolean;
  childName: string;
  childSex: "L" | "P";
  childBirth: string;
  posyanduId: string;
  guardian: string;
  consentAt: string;
  date: string;
  weight: number;
  height: number;
  lying: boolean;
  /** Email of the account that recorded the entry, so a shared phone never sends
      or shows another kader's pending entries under the wrong login. */
  ownerEmail?: string;
  error?: string;
}

// Pending offline entries live in localStorage, not the full child dataset: only what the kader
// typed while offline, shown in the app until it is sent, then removed.
const QUEUE_KEY = "sindaparka.queue.v1";
function readQueue(): QueuedEntry[] {
  try { const v = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}
function writeQueue(q: QueuedEntry[]) {
  try { if (q.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); else localStorage.removeItem(QUEUE_KEY); } catch {}
}

/** Accounts previously used on this device, for quick switching on shared phones.
    Only the email and display name are remembered - never the password; switching
    always requires typing the password again. */
export interface RecentKader { email: string; name: string; at: string }
const RECENT_KEY = "sindaparka.recentKader.v1";
export function readRecentKader(): RecentKader[] {
  try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => x && typeof x.email === "string") : []; } catch { return []; }
}
function rememberKader(email: string, name: string) {
  try {
    const list = [{ email, name, at: new Date().toISOString() }, ...readRecentKader().filter((x) => x.email !== email)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {}
}

// Child data is kept in memory only. It is never written to localStorage.
const LANG_KEY = "sindaparka.lang";
const empty = (lang: "id" | "en"): State => ({
  ready: false, loading: false, loaded: false, error: null, userId: null, email: null, fullName: "", role: null, status: null,
  posyandu: "all", posyanduId: null, posyanduList: [], puskesmasList: [], children: [], measurements: [], immunizations: [], lang,
  queue: readQueue(),
});
let state: State | null = null;
const listeners = new Set<() => void>();
let started = false;

function get(): State {
  if (!state) {
    let lang: "id" | "en" = "id";
    try { if (localStorage.getItem(LANG_KEY) === "en") lang = "en"; } catch {}
    state = empty(lang);
  }
  return state;
}
function patch(p: Partial<State>) {
  state = { ...get(), ...p };
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const serverSnapshot = () => null;

export function useStore(): State | null {
  const s = useSyncExternalStore(subscribe, get, serverSnapshot);
  useEffect(() => { start(); }, []);
  return s;
}

/** True when the failure looks like a lost connection, not a server-side rejection. */
const isOfflineError = (e: unknown) => {
  const m = String((e as { message?: string })?.message ?? e).toLowerCase();
  return m.includes("fetch") || m.includes("network") || m.includes("failed to fetch") || m.includes("load failed") || m.includes("koneksi");
};

const msg = (e: unknown) => {
  const m = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Terjadi kesalahan.";
  if (m.includes("children_no_duplicate")) return "Anak dengan nama, jenis kelamin, dan tanggal lahir yang sama sudah terdaftar di posyandu ini.";
  if (m.includes("children_consent_required")) return "Persetujuan orang tua atau wali harus dicatat.";
  return m;
};

async function fetchAll<T>(table: string, cols: string, order: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await supabase.from(table).select(cols).order(order).range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as unknown as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

const withTimeout = <T,>(p: PromiseLike<T>, ms = 15000): Promise<T> =>
  Promise.race([Promise.resolve(p), new Promise<T>((_, rej) => setTimeout(() => rej(new Error("Koneksi lambat atau terputus. Periksa sinyal lalu coba lagi.")), ms))]);

async function refresh() {
  const { data: sess } = await supabase.auth.getSession();
  const user = sess.session?.user;
  if (!user) { patch({ ...empty(get().lang), ready: true }); return; }
  patch({ loading: true, loaded: false, error: null });
  try {
    const { data: p, error: pe } = await withTimeout(supabase.from("profiles").select("*").eq("id", user.id).maybeSingle());
    if (pe) throw pe;
    if (!p) { patch({ ready: true, loading: false, userId: user.id, email: user.email ?? null, status: "pending", role: "kader" }); return; }
    const base = { ready: true, userId: user.id, email: user.email ?? null, fullName: p.full_name as string, role: p.role as Role, status: p.status as AccountStatus, posyanduId: p.posyandu_id as string | null };
    if (p.status !== "active") { patch({ ...base, loading: false, loaded: true, children: [], measurements: [], immunizations: [], posyanduList: [], puskesmasList: [] }); return; }
    // Patch identity before the bulk fetch so a transient failure shows the retryable error
    // state instead of bouncing the user back to /masuk (userId would still be null).
    patch(base);
    const [pk0, pos, kids, ms, ims] = await withTimeout(Promise.all([
      fetchAll<{ id: string; name: string; endemic_vaccines: boolean }>("puskesmas", "id,name,endemic_vaccines", "name"),
      fetchAll<{ id: string; name: string; puskesmas_id: string; visit_day: number | null; latitude: number | null; longitude: number | null; dusun: string | null; is_demo: boolean | null }>("posyandu", "id,name,puskesmas_id,visit_day,latitude,longitude,dusun,is_demo", "name"),
      fetchAll<Record<string, string | null>>("children", "id,name,sex,birth_date,posyandu_id,guardian_name,consent_at", "name"),
      fetchAll<Record<string, string | number | boolean | null>>("measurements", "id,child_id,measured_on,weight_kg,length_height_cm,lying,note", "measured_on"),
      fetchAll<{ id: string; child_id: string; vaccine: string; given_on: string }>("immunizations", "id,child_id,vaccine,given_on", "given_on"),
    ]));
    const pk = pk0.map((x) => ({ id: x.id, name: x.name, endemicVaccines: !!x.endemic_vaccines }));
    const immunizations: Immunization[] = ims.map((i) => ({ id: i.id, childId: i.child_id, vaccine: i.vaccine, givenOn: i.given_on }));
    const posyanduList = pos.map((x) => ({ id: x.id, name: x.name, puskesmasId: x.puskesmas_id, visitDay: x.visit_day ?? null, lat: x.latitude ?? null, lng: x.longitude ?? null, dusun: x.dusun ?? null, isDemo: x.is_demo === true }));
    const nameOf = new Map(posyanduList.map((x) => [x.id, x.name]));
    const children: Child[] = kids.map((k) => ({
      id: k.id as string, name: k.name as string, sex: k.sex as "L" | "P", birth: k.birth_date as string,
      posyanduId: k.posyandu_id as string, posyandu: nameOf.get(k.posyandu_id as string) ?? "-", guardian: (k.guardian_name as string) ?? "-", consentAt: k.consent_at,
    }));
    const measurements: Measurement[] = ms.map((m) => ({
      id: m.id as string, childId: m.child_id as string, date: m.measured_on as string, weight: Number(m.weight_kg), height: Number(m.length_height_cm),
      lying: m.lying as boolean, note: (m.note as string) ?? undefined,
    }));
    patch({
      ...base, loading: false, loaded: true, posyanduList, puskesmasList: pk, children, measurements, immunizations,
      posyandu: p.role === "kader" ? nameOf.get(p.posyandu_id as string) ?? "-" : "all",
    });
  } catch (e) {
    patch({ loading: false, loaded: true, ready: true, error: msg(e) });
  }
}

function start() {
  if (started) return;
  started = true;
  refresh();
  supabase.auth.onAuthStateChange((ev) => {
    if (ev === "SIGNED_IN" || ev === "SIGNED_OUT" || ev === "USER_UPDATED") setTimeout(refresh, 0);
  });
  window.addEventListener("online", () => { if (readQueue().length) actions.syncQueue(); });
  if (navigator.onLine && readQueue().length) setTimeout(() => actions.syncQueue(), 4000);
}

export const actions = {
  refresh,
  setLang(lang: "id" | "en") {
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
    patch({ lang });
  },
  async signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return error.message === "Invalid login credentials" ? "Email atau kata sandi salah." : error.message === "Email not confirmed" ? "Email belum dikonfirmasi. Cek kotak masuk Anda." : error.message;
    await refresh();
    rememberKader(email.trim(), get().fullName || email.trim());
    return null;
  },
  async signUp(email: string, password: string, fullName: string): Promise<{ error?: string; needsConfirm?: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password, options: { data: { full_name: fullName.trim() }, emailRedirectTo: typeof location !== "undefined" ? location.origin + "/masuk" : undefined },
    });
    if (error) return { error: error.message };
    return { needsConfirm: !data.session };
  },
  forgetKader(email: string) {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(readRecentKader().filter((x) => x.email !== email))); } catch {}
  },
  async signOut() {
    await supabase.auth.signOut();
    patch({ ...empty(get().lang), ready: true });
  },
  async resetPassword(email: string): Promise<string | null> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + "/atur-ulang" });
    return error ? error.message : null;
  },
  async setPassword(password: string): Promise<string | null> {
    const { error } = await supabase.auth.updateUser({ password });
    return error ? error.message : null;
  },
  async addChild(c: { name: string; sex: "L" | "P"; birth: string; posyanduId: string; guardian: string; consentAt: string }): Promise<{ id?: string; error?: string }> {
    const s = get();
    const { data, error } = await supabase.from("children").insert({
      name: c.name, sex: c.sex, birth_date: c.birth, posyandu_id: c.posyanduId, guardian_name: c.guardian || null,
      consent_at: c.consentAt, consent_recorded_by: s.userId,
    }).select("id").single();
    if (error) return { error: msg(error) };
    await refresh(); // so the new child is in memory for the z-score snapshot
    return { id: data.id as string };
  },
  async addMeasurement(m: { childId: string; date: string; weight: number; height: number; lying: boolean; note?: string }): Promise<string | null> {
    const child = get().children.find((c) => c.id === m.childId);
    let z: { hfa: number | null; wfa: number | null; wfh: number | null; bfa: number | null } | null = null;
    if (child) {
      const a = assess(child.sex, ageInMonths(child.birth, m.date), m.weight, m.height, m.lying);
      z = { hfa: a.hfa, wfa: a.wfa, wfh: a.wfh, bfa: a.bfa };
    }
    const r2 = (v: number | null | undefined) => (v == null ? null : Math.round(v * 100) / 100);
    const { error } = await supabase.from("measurements").insert({
      child_id: m.childId, measured_on: m.date, weight_kg: m.weight, length_height_cm: m.height, lying: m.lying, note: m.note ?? null,
      z_hfa: r2(z?.hfa), z_wfa: r2(z?.wfa), z_wfh: r2(z?.wfh), z_bfa: r2(z?.bfa),
    });
    if (error) return msg(error);
    await refresh();
    return null;
  },
  /** Queue a penimbangan made while offline. Returns null (it is safely on the device). */
  queueMeasurement(e: Omit<QueuedEntry, "id" | "queuedAt">): null {
    const entry: QueuedEntry = { ...e, id: crypto.randomUUID(), queuedAt: new Date().toISOString(), ownerEmail: state?.email ?? undefined };
    const q = [...readQueue(), entry];
    writeQueue(q);
    patch({ queue: q });
    return null;
  },
  removeQueued(id: string) {
    const q = readQueue().filter((x) => x.id !== id);
    writeQueue(q);
    patch({ queue: q });
  },
  /** Send queued entries oldest-first. Never overwrites: a server-side conflict keeps the entry
      on the device with its error message for the kader to resolve. */
  async syncQueue(): Promise<{ sent: number; failed: number }> {
    let sent = 0, failed = 0;
    const me = get().email;
    for (const entry of readQueue()) {
      if (entry.ownerEmail && me && entry.ownerEmail !== me) continue; // belongs to another kader on this shared device
      try {
        if (entry.isNewChild) {
          const { data: existing } = await supabase.from("children").select("id").eq("id", entry.childId).maybeSingle();
          if (!existing) {
            const { error } = await supabase.from("children").insert({
              id: entry.childId, name: entry.childName, sex: entry.childSex, birth_date: entry.childBirth,
              posyandu_id: entry.posyanduId, guardian_name: entry.guardian || null, consent_at: entry.consentAt,
            });
            if (error) throw error;
          }
        }
        // duplicate guard: an identical measurement already on the server counts as sent
        const { data: dup, error: de } = await supabase.from("measurements").select("id,weight_kg,length_height_cm")
          .eq("child_id", entry.childId).eq("measured_on", entry.date).is("deleted_at", null);
        if (de) throw de;
        const same = (dup ?? []).some((m) => Number(m.weight_kg) === entry.weight && Number(m.length_height_cm) === entry.height);
        if (!same) {
          const a = assess(entry.childSex, ageInMonths(entry.childBirth, entry.date), entry.weight, entry.height, entry.lying);
          const r2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);
          const { error } = await supabase.from("measurements").insert({
            child_id: entry.childId, measured_on: entry.date, weight_kg: entry.weight, length_height_cm: entry.height, lying: entry.lying,
            z_hfa: r2(a.hfa), z_wfa: r2(a.wfa), z_wfh: r2(a.wfh), z_bfa: r2(a.bfa),
          });
          if (error) throw error;
        }
        sent++;
        const q = readQueue().filter((x) => x.id !== entry.id);
        writeQueue(q);
        patch({ queue: q });
      } catch (e) {
        failed++;
        const m = msg(e);
        const q = readQueue().map((x) => (x.id === entry.id ? { ...x, error: m } : x));
        writeQueue(q);
        patch({ queue: q });
        if (isOfflineError(e)) break; // still offline: stop, keep the rest for later
      }
    }
    if (sent > 0) await refresh();
    return { sent, failed };
  },
  async deleteMeasurement(id: string): Promise<string | null> {
    // Soft-delete goes through a SECURITY DEFINER RPC: a client UPDATE can't set
    // deleted_at because the measurements_read SELECT policy (deleted_at is null)
    // is checked against the new row and always rejects it (Postgres WCO_RLS_SELECT_CHECK).
    const { error } = await supabase.rpc("soft_delete_measurement", { m: id });
    if (error) return msg(error);
    await refresh();
    return null;
  },
  async setImmunization(childId: string, vaccine: string, givenOn: string): Promise<string | null> {
    const { error } = await supabase.from("immunizations").upsert({ child_id: childId, vaccine, given_on: givenOn }, { onConflict: "child_id,vaccine" });
    if (error) return msg(error);
    await refresh();
    return null;
  },
  async removeImmunization(id: string): Promise<string | null> {
    const { error } = await supabase.from("immunizations").delete().eq("id", id);
    if (error) return msg(error);
    await refresh();
    return null;
  },
  async setPosyanduDay(posyanduId: string, day: number | null): Promise<string | null> {
    const { error } = await supabase.rpc("set_posyandu_day", { p: posyanduId, d: day });
    if (error) return msg(error);
    await refresh();
    return null;
  },
  async setEndemicVaccines(puskesmasId: string, on: boolean): Promise<string | null> {
    const { error } = await supabase.from("puskesmas").update({ endemic_vaccines: on }).eq("id", puskesmasId);
    if (error) return msg(error);
    await refresh();
    return null;
  },
  // ---- admin
  async listProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((p) => ({ id: p.id, fullName: p.full_name, role: p.role, status: p.status, puskesmasId: p.puskesmas_id, posyanduId: p.posyandu_id, createdAt: p.created_at }));
  },
  async updateProfile(id: string, p: { role: Role; status: AccountStatus; posyanduId: string | null; puskesmasId: string | null }): Promise<string | null> {
    const { error } = await supabase.from("profiles").update({ role: p.role, status: p.status, posyandu_id: p.posyanduId, puskesmas_id: p.puskesmasId }).eq("id", id);
    return error ? msg(error) : null;
  },
  async hasDemo(): Promise<boolean> {
    const { data } = await supabase.rpc("has_demo_data");
    return data === true;
  },
  async deleteDemo(): Promise<string> {
    const { data, error } = await supabase.rpc("delete_demo_data");
    if (error) return msg(error);
    await refresh();
    const d = data as { children: number; measurements: number };
    return `Data uji coba dihapus: ${d.children} anak dan ${d.measurements} pengukuran.`;
  },
  async listAudit(before?: number): Promise<AuditEntry[]> {
    let q = supabase.from("audit_log").select("*").order("id", { ascending: false }).limit(50);
    if (before != null) q = q.lt("id", before);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as number, at: r.at as string, actor: (r.actor as string) ?? null,
      action: r.action as AuditEntry["action"], table: r.table_name as string, rowId: (r.row_id as string) ?? null,
      oldData: (r.old_data as Record<string, unknown>) ?? null, newData: (r.new_data as Record<string, unknown>) ?? null,
    }));
  },
  async addPuskesmas(name: string): Promise<string | null> {
    const { error } = await supabase.from("puskesmas").insert({ name: name.trim() });
    if (error) return msg(error);
    await refresh();
    return null;
  },
  async setPosyanduLocation(id: string, v: { lat: number | null; lng: number | null; dusun: string }): Promise<string | null> {
    const { error } = await supabase.from("posyandu").update({ latitude: v.lat, longitude: v.lng, dusun: v.dusun.trim() || null }).eq("id", id);
    if (error) return msg(error);
    await refresh();
    return null;
  },
  async addPosyanduBulk(puskesmasId: string, items: { name: string; dusun: string }[]): Promise<string | null> {
    const { error } = await supabase.from("posyandu").insert(items.map((i) => ({ name: i.name, dusun: i.dusun || null, puskesmas_id: puskesmasId })));
    if (error) return msg(error);
    await refresh();
    return null;
  },
  async addPosyandu(name: string, puskesmasId: string): Promise<string | null> {
    const { error } = await supabase.from("posyandu").insert({ name: name.trim(), puskesmas_id: puskesmasId });
    if (error) return msg(error);
    await refresh();
    return null;
  },
};

export function useOnline(): boolean {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const u = () => setOn(navigator.onLine);
    u();
    window.addEventListener("online", u);
    window.addEventListener("offline", u);
    return () => {
      window.removeEventListener("online", u);
      window.removeEventListener("offline", u);
    };
  }, []);
  return on;
}
