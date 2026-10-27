import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { cleanQuery } from "@/lib/format";

/** Words every gym name shares; they say nothing about which place it is. */
const COMMON = new Set(["نادي", "جيم", "صالة", "مركز", "اكاديمية", "أكاديمية", "رياضي", "الرياضي", "للياقة", "البدنية", "لياقة", "فتنس", "ليديز", "للسيدات", "gym", "fitness", "club", "center", "centre", "the", "sport", "sports", "academy", "ladies", "studio"]);

/** The distinctive word of a place name ("Gulf gym" → "gulf"), or "" when nothing is left. */
export function keyWord(name: string): string {
  const words = cleanQuery(name).toLowerCase().split(/[\s\-_.،,]+/).filter((w) => w.length >= 3 && !COMMON.has(w));
  return words.sort((a, b) => b.length - a.length)[0] ?? "";
}

export type SimilarOrg = { id: string; name_ar: string; slug: string; city: string; area: string | null; is_claimed: boolean };

/** Published places whose name shares the distinctive word: likely the same place registering again. */
export async function findSimilar(db: SupabaseClient<Database>, name: string, opts: { city?: string; excludeId?: string; limit?: number } = {}): Promise<SimilarOrg[]> {
  const k = keyWord(name);
  if (!k) return [];
  let q = db.from("organizations").select("id,name_ar,slug,city,area,is_claimed").eq("status", "published")
    .or(`name_ar.ilike.%${k}%,name_en.ilike.%${k}%`).limit(opts.limit ?? 5);
  if (opts.city) q = q.eq("city", opts.city);
  if (opts.excludeId) q = q.neq("id", opts.excludeId);
  const { data } = await q;
  return data ?? [];
}
