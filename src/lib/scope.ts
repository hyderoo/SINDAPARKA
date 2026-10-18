"use client";
import { useMemo } from "react";
import { useStore } from "./store";
import { rows } from "./analytics";

export function useScope() {
  const s = useStore();
  return useMemo(() => {
    if (!s) return null;
    const children = s.role === "kader" ? s.children.filter((c) => c.posyandu === s.posyandu) : s.children;
    const ids = new Set(children.map((c) => c.id));
    const measurements = s.measurements.filter((m) => ids.has(m.childId));
    return { s, children, measurements, rows: rows(children, measurements) };
  }, [s]);
}
