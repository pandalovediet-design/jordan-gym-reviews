/** Pure helpers for the workout log (dates are Amman calendar days, "YYYY-MM-DD"). */
import { isMuscle, type Muscle } from "@/lib/exercise-meta";

export type Entry = { kind: string; min: number; muscles?: Muscle[] };
export type Log = Record<string, Entry>;
export type Settings = { goal: number };

export const KINDS = ["حديد", "كارديو", "مشي أو جري", "سباحة", "فنون قتالية", "رياضة جماعية", "يوغا أو إطالة", "تمرين منزلي"] as const;
export const MINUTES = [15, 30, 45, 60, 90] as const;
export const GOALS = [2, 3, 4, 5, 6] as const;

const DAY = 86_400_000;
const toKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const toMs = (key: string) => Date.parse(`${key}T00:00:00Z`);
export const addDays = (key: string, n: number) => toKey(toMs(key) + n * DAY);
export const ammanToday = () => toKey(Date.now() + 3 * 3_600_000);
/** 0 = Sunday (Jordan's week starts on Sunday). */
export const dow = (key: string) => new Date(toMs(key)).getUTCDay();

export function sanitize(raw: unknown): Log {
  const out: Log = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !v || typeof v !== "object") continue;
    const e = v as { kind?: unknown; min?: unknown; muscles?: unknown };
    const muscles = Array.isArray(e.muscles) ? [...new Set(e.muscles.filter((m): m is Muscle => typeof m === "string" && isMuscle(m)))] : [];
    out[k] = { kind: typeof e.kind === "string" ? e.kind.slice(0, 40) : "تمرين", min: typeof e.min === "number" && e.min > 0 && e.min < 1000 ? Math.round(e.min) : 0, ...(muscles.length ? { muscles } : {}) };
  }
  return out;
}

/** Current streak: consecutive trained days ending today, or yesterday while today is still open. */
export function streak(log: Log, today: string): number {
  let day = log[today] ? today : addDays(today, -1);
  let n = 0;
  while (log[day]) { n++; day = addDays(day, -1); }
  return n;
}
export function bestStreak(log: Log): number {
  const days = Object.keys(log).sort();
  let best = 0, run = 0, prev = "";
  for (const d of days) { run = prev && addDays(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; }
  return best;
}
export const weekStart = (today: string) => addDays(today, -dow(today));
export const daysThisWeek = (log: Log, today: string) => { const s = weekStart(today); return Array.from({ length: 7 }, (_, i) => addDays(s, i)).filter((d) => d <= today && log[d]).length; };
export const monthCount = (log: Log, today: string) => Object.keys(log).filter((d) => d.slice(0, 7) === today.slice(0, 7)).length;

/** Muscles trained in the week (Sunday start) that contains today. */
export function musclesThisWeek(log: Log, today: string): Muscle[] {
  const s = weekStart(today);
  const out = new Set<Muscle>();
  for (let i = 0; i < 7; i++) for (const m of log[addDays(s, i)]?.muscles ?? []) out.add(m);
  return [...out];
}
