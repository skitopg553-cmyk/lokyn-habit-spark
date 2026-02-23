import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export const JOUR_MAP = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
export const JOUR_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export const ICON_MAP: Record<string, { icon: string; color: string; bg: string }> = {
  sport: { icon: "fitness_center", color: "text-primary", bg: "bg-primary/20" },
  projet: { icon: "work", color: "text-purple-400", bg: "bg-purple-500/20" },
  connaissance: { icon: "menu_book", color: "text-blue-400", bg: "bg-blue-500/20" },
  addiction: { icon: "block", color: "text-red-400", bg: "bg-red-500/20" },
  mental: { icon: "self_improvement", color: "text-emerald-500", bg: "bg-emerald-500/20" },
  nutrition: { icon: "water_drop", color: "text-amber-500", bg: "bg-amber-500/20" },
};
