import { MUSCLE_LABEL, type Muscle } from "@/lib/exercise-meta";

export const EQUIPMENT = ["none", "bands", "dumbbell", "chair", "mat", "pullup_bar", "other"] as const;
export type Equipment = (typeof EQUIPMENT)[number];
export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  none: "بدون أدوات", bands: "حبال مقاومة", dumbbell: "دمبل منزلي", chair: "كرسي", mat: "ماط", pullup_bar: "بار تعليق", other: "أدوات ثانية",
};
export const EQUIPMENT_ICON: Record<Equipment, string> = { none: "🙌", bands: "🪢", dumbbell: "🏋️", chair: "🪑", mat: "🧘", pullup_bar: "🤸", other: "🎒" };
/** Poster gradient per equipment (used when a video has no cover image). */
export const EQUIPMENT_GRADIENT: Record<Equipment, string> = {
  none: "from-emerald-500/40 via-teal-700/30 to-black",
  bands: "from-lime-400/40 via-emerald-700/30 to-black",
  dumbbell: "from-amber-400/35 via-orange-800/30 to-black",
  chair: "from-sky-400/35 via-indigo-800/30 to-black",
  mat: "from-fuchsia-400/30 via-purple-800/30 to-black",
  pullup_bar: "from-rose-400/35 via-red-900/30 to-black",
  other: "from-zinc-400/30 via-zinc-800/30 to-black",
};
export const FOCUS = ["full_body", "cardio", "chest", "shoulders", "biceps", "triceps", "forearms", "abs", "back", "glutes", "quads", "hamstrings", "calves"] as const;
export type Focus = (typeof FOCUS)[number];
export const FOCUS_LABEL: Record<Focus, string> = { full_body: "كامل الجسم", cardio: "كارديو", ...MUSCLE_LABEL } as Record<Focus, string>;
export const isEquipment = (v: string): v is Equipment => (EQUIPMENT as readonly string[]).includes(v);
export const focusLabel = (v: string) => FOCUS_LABEL[v as Focus] ?? MUSCLE_LABEL[v as Muscle] ?? v;
export const equipLabel = (v: string) => EQUIPMENT_LABEL[v as Equipment] ?? v;
export const equipIcon = (v: string) => EQUIPMENT_ICON[v as Equipment] ?? "🎒";
export const equipGradient = (v: string) => EQUIPMENT_GRADIENT[v as Equipment] ?? EQUIPMENT_GRADIENT.other;
