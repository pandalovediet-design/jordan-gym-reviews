/** Pure helpers for the food log. No calories on purpose: what you ate and how it felt. */
import { addDays } from "@/lib/workout-log";

export const MEALS = [
  { id: "breakfast", label: "فطور", icon: "🌅" },
  { id: "lunch", label: "غدا", icon: "☀️" },
  { id: "dinner", label: "عشا", icon: "🌙" },
  { id: "snack", label: "سناك", icon: "🍎" },
] as const;
export type MealId = (typeof MEALS)[number]["id"];

export const RATINGS = [
  { id: "healthy", label: "صحي", icon: "🥗" },
  { id: "ok", label: "مقبول", icon: "🙂" },
  { id: "free", label: "أكلة حرة", icon: "🍔" },
] as const;
export type RatingId = (typeof RATINGS)[number]["id"];

export type MealEntry = { note: string; rating: RatingId };
export type FoodDay = Partial<Record<MealId, MealEntry>>;
export type FoodLog = Record<string, FoodDay>;
export type WaterLog = Record<string, number>;

export const WATER_MAX = 20;
export const WATER_GOAL = 8;
export const NOTE_MAX = 120;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const isMeal = (v: unknown): v is MealId => MEALS.some((m) => m.id === v);
export const isRating = (v: unknown): v is RatingId => RATINGS.some((r) => r.id === v);

export function sanitizeFood(raw: unknown): FoodLog {
  const out: FoodLog = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [date, day] of Object.entries(raw as Record<string, unknown>)) {
    if (!DATE.test(date) || !day || typeof day !== "object") continue;
    const clean: FoodDay = {};
    for (const [meal, entry] of Object.entries(day as Record<string, unknown>)) {
      if (!isMeal(meal) || !entry || typeof entry !== "object") continue;
      const e = entry as { note?: unknown; rating?: unknown };
      if (!isRating(e.rating)) continue;
      clean[meal] = { rating: e.rating, note: typeof e.note === "string" ? e.note.slice(0, NOTE_MAX) : "" };
    }
    if (Object.keys(clean).length) out[date] = clean;
  }
  return out;
}

export function sanitizeWater(raw: unknown): WaterLog {
  const out: WaterLog = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [date, cups] of Object.entries(raw as Record<string, unknown>)) {
    if (DATE.test(date) && Number.isInteger(cups) && (cups as number) > 0 && (cups as number) <= WATER_MAX) out[date] = cups as number;
  }
  return out;
}

/** A day counts as healthy when at least two meals are logged and none of them is a free meal. */
export function isHealthyDay(day: FoodDay | undefined): boolean {
  if (!day) return false;
  const entries = Object.values(day).filter(Boolean) as MealEntry[];
  return entries.length >= 2 && entries.every((e) => e.rating !== "free");
}

/** Consecutive healthy days ending today, or yesterday while today is still open. */
export function healthyStreak(log: FoodLog, today: string): number {
  let day = isHealthyDay(log[today]) ? today : addDays(today, -1);
  let n = 0;
  while (isHealthyDay(log[day])) { n++; day = addDays(day, -1); }
  return n;
}

/** Count of each rating across the 7 days ending today. */
export function weekRatings(log: FoodLog, today: string): Record<RatingId, number> {
  const out: Record<RatingId, number> = { healthy: 0, ok: 0, free: 0 };
  for (let i = 0; i < 7; i++) {
    for (const e of Object.values(log[addDays(today, -i)] ?? {})) if (e) out[e.rating]++;
  }
  return out;
}
