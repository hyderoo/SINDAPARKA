import type { Sex } from "./who";

export interface Child {
  id: string;
  name: string;
  sex: Sex;
  birth: string; // YYYY-MM-DD
  posyandu: string;
  guardian: string;
}
export interface Measurement {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD
  weight: number;
  height: number;
  note?: string;
  pending?: boolean; // saved on this device, not yet synced
}
export type Role = "kader" | "admin";
