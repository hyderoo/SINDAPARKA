"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { Child, Measurement, Role } from "./types";
import { seedData } from "./seed";
import { todayISO } from "./age";

interface State {
  children: Child[];
  measurements: Measurement[];
  role: Role | null;
  posyandu: string; // kader's own posyandu, or "all"
  lang: "id" | "en";
}
const KEY = "sindaparka.v2";
let state: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {}
  const s = seedData(todayISO());
  return { ...s, role: null, posyandu: "all", lang: "id" };
}
function get(): State {
  if (!state) state = load();
  return state;
}
function set(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const serverSnapshot = () => null;

export function useStore(): State | null {
  return useSyncExternalStore(subscribe, get, serverSnapshot);
}

export const actions = {
  login(role: Role, posyandu: string) {
    set({ ...get(), role, posyandu: role === "admin" ? "all" : posyandu });
  },
  logout() {
    set({ ...get(), role: null });
  },
  setLang(lang: "id" | "en") {
    set({ ...get(), lang });
  },
  addChild(c: Omit<Child, "id">): Child {
    const s = get();
    const child = { ...c, id: "c" + Date.now().toString(36) };
    set({ ...s, children: [child, ...s.children] });
    return child;
  },
  addMeasurement(m: Omit<Measurement, "id" | "pending">) {
    const s = get();
    set({ ...s, measurements: [...s.measurements, { ...m, id: "m" + Date.now().toString(36), pending: true }] });
  },
  deleteMeasurement(id: string) {
    const s = get();
    set({ ...s, measurements: s.measurements.filter((m) => m.id !== id) });
  },
  syncPending() {
    const s = get();
    set({ ...s, measurements: s.measurements.map((m) => ({ ...m, pending: false })) });
  },
  resetDemo() {
    const s = seedData(todayISO());
    set({ ...get(), ...s });
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
