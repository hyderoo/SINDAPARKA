import type { Sex } from "./who";

export interface Child {
  id: string;
  name: string;
  sex: Sex;
  birth: string; // YYYY-MM-DD
  posyandu: string; // posyandu name (display)
  posyanduId: string;
  guardian: string;
  consentAt?: string | null;
}
export interface Measurement {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD
  weight: number;
  height: number;
  lying?: boolean; // measured lying down (length) vs standing (height)
  note?: string;
}
export type Role = "kader" | "nakes" | "admin";
export type AccountStatus = "pending" | "active" | "disabled";
export interface Posyandu {
  id: string;
  name: string;
  puskesmasId: string;
  visitDay: number | null; // day of the month the posyandu is held
  lat: number | null;
  lng: number | null;
  dusun: string | null;
  isDemo: boolean;
}
export interface Puskesmas {
  id: string;
  name: string;
  endemicVaccines: boolean; // show endemic-area-only vaccines (e.g. Japanese Encephalitis)
}
export interface Immunization {
  id: string;
  childId: string;
  vaccine: string; // dose code, see schedule.ts
  givenOn: string; // YYYY-MM-DD
}
export interface Profile {
  id: string;
  fullName: string;
  role: Role;
  status: AccountStatus;
  puskesmasId: string | null;
  posyanduId: string | null;
  createdAt: string;
}

export interface AuditEntry {
  id: number;
  at: string; // ISO timestamptz
  actor: string | null; // auth user id
  action: "INSERT" | "UPDATE" | "DELETE";
  table: string; // children | measurements | immunizations
  rowId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
}
