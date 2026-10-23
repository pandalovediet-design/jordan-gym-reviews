import type { Tables } from "@/lib/database.types";

export type Hour = Pick<Tables<"organization_hours">, "organization_id" | "weekday" | "opens_at" | "closes_at" | "is_closed">;
export const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Jordan wall-clock: weekday (0=Sun) and minutes since midnight. */
export function ammanNow() {
  const d = new Date(Date.now() + 3 * 3_600_000);
  return { weekday: d.getUTCDay(), minutes: d.getUTCHours() * 60 + d.getUTCMinutes(), date: d.toISOString().slice(0, 10) };
}

export function isOpenAt(rows: Hour[], weekday: number, minutes: number) {
  return rows.some((h) => {
    if (h.is_closed || !h.opens_at || !h.closes_at) return false;
    const o = mins(h.opens_at), c = mins(h.closes_at);
    if (h.weekday === weekday) return o <= c ? minutes >= o && minutes < c : minutes >= o;
    // overnight hours that started yesterday
    return h.weekday === (weekday + 6) % 7 && o > c && minutes < c;
  });
}

