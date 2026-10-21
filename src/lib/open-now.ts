import { createPublicClient } from "@/lib/supabase/public";
import { listBySlugs, searchOrgs } from "@/lib/queries";
import type { Tables } from "@/lib/database.types";

type Hour = Pick<Tables<"organization_hours">, "organization_id" | "weekday" | "opens_at" | "closes_at" | "is_closed">;
const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

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

type Listing = Awaited<ReturnType<typeof searchOrgs>>["items"][number];

/** Nearest places that are open right now, plus facilities that still have free slots today. */
export async function listOpenNow(near: { lat: number; lng: number }, type?: string) {
  const pages = await Promise.all([1, 2, 3].map((page) => searchOrgs({ near, type, page }).catch(() => ({ total: 0, items: [] as Listing[] }))));
  const nearby = pages.flatMap((p) => p.items);
  if (nearby.length === 0) return { open: [] as Listing[], slots: [] as { slug: string; name_ar: string; city: string; starts_at: string; ends_at: string }[] };
  const db = createPublicClient();
  const now = ammanNow();
  const { data: hours } = await db.from("organization_hours").select("organization_id,weekday,opens_at,closes_at,is_closed").in("organization_id", nearby.map((o) => o.id));
  const byOrg = new Map<string, Hour[]>();
  for (const h of hours ?? []) byOrg.set(h.organization_id, [...(byOrg.get(h.organization_id) ?? []), h]);
  const open = nearby.filter((o) => isOpenAt(byOrg.get(o.id) ?? [], now.weekday, now.minutes));
  const { data: slotRows } = await db.from("facility_slots")
    .select("starts_at,ends_at,organizations(slug,name_ar,city,status)")
    .eq("slot_date", now.date).eq("status", "available").order("starts_at").limit(60);
  const slots = (slotRows ?? [])
    .filter((s) => s.organizations?.status === "published" && mins(s.ends_at) > now.minutes)
    .map((s) => ({ slug: s.organizations!.slug, name_ar: s.organizations!.name_ar, city: s.organizations!.city, starts_at: s.starts_at, ends_at: s.ends_at }));
  return { open, slots };
}

/** Published gyms open late (closing at or after 23:00, or overnight) on at least one weekday. */
export async function listOpenLate(limit = 24) {
  const db = createPublicClient();
  const { data } = await db.from("organization_hours").select("organization_id,opens_at,closes_at,is_closed").eq("is_closed", false);
  const ids = [...new Set((data ?? []).filter((h) => h.opens_at && h.closes_at && (mins(h.closes_at) >= 23 * 60 || mins(h.closes_at) < mins(h.opens_at))).map((h) => h.organization_id))];
  if (ids.length === 0) return [];
  const { data: rows } = await db.from("organizations_listing").select("slug").in("id", ids).eq("type", "gym").limit(limit);
  return listBySlugs((rows ?? []).flatMap((r) => (r.slug ? [r.slug] : [])));
}
