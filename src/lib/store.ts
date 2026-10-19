"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { AccountStatus, Child, Immunization, Measurement, Posyandu, Profile, Puskesmas, Role } from "./types";
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
}

// Child data is kept in memory only. It is never written to localStorage.
const LANG_KEY = "sindaparka.lang";
const empty = (lang: "id" | "en"): State => ({
  ready: false, loading: false, loaded: false, error: null, userId: null, email: null, fullName: "", role: null, status: null,
  posyandu: "all", posyanduId: null, posyanduList: [], puskesmasList: [], children: [], measurements: [], immunizations: [], lang,
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

const msg = (e: unknown) => (e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Terjadi kesalahan.");

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
    const [pk0, pos, kids, ms, ims] = await withTimeout(Promise.all([
      fetchAll<{ id: string; name: string; endemic_vaccines: boolean }>("puskesmas", "id,name,endemic_vaccines", "name"),
      fetchAll<{ id: string; name: string; puskesmas_id: string; visit_day: number | null }>("posyandu", "id,name,puskesmas_id,visit_day", "name"),
      fetchAll<Record<string, string | null>>("children", "id,name,sex,birth_date,posyandu_id,guardian_name,consent_at", "name"),
      fetchAll<Record<string, string | number | boolean | null>>("measurements", "id,child_id,measured_on,weight_kg,length_height_cm,lying,note", "measured_on"),
      fetchAll<{ id: string; child_id: string; vaccine: string; given_on: string }>("immunizations", "id,child_id,vaccine,given_on", "given_on"),
    ]));
    const pk = pk0.map((x) => ({ id: x.id, name: x.name, endemicVaccines: !!x.endemic_vaccines }));
    const immunizations: Immunization[] = ims.map((i) => ({ id: i.id, childId: i.child_id, vaccine: i.vaccine, givenOn: i.given_on }));
    const posyanduList = pos.map((x) => ({ id: x.id, name: x.name, puskesmasId: x.puskesmas_id, visitDay: x.visit_day ?? null }));
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
    return null;
  },
  async signUp(email: string, password: string, fullName: string): Promise<{ error?: string; needsConfirm?: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password, options: { data: { full_name: fullName.trim() }, emailRedirectTo: typeof location !== "undefined" ? location.origin + "/masuk" : undefined },
    });
    if (error) return { error: error.message };
    return { needsConfirm: !data.session };
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
  async deleteMeasurement(id: string): Promise<string | null> {
    const { error } = await supabase.from("measurements").update({ deleted_at: new Date().toISOString() }).eq("id", id);
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
  async addPuskesmas(name: string): Promise<string | null> {
    const { error } = await supabase.from("puskesmas").insert({ name: name.trim() });
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
