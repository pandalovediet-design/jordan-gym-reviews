import { createPublicClient } from "@/lib/supabase/public";
import { MARKET } from "@/lib/market";

export type LiveAd = { id: string; placement: string; title: string; subtitle: string | null; image_path: string | null; link_url: string };

export async function listLiveAds(): Promise<LiveAd[]> {
  const { data } = await createPublicClient()
    .from("ads")
    .select("id,placement,title,subtitle,image_path,link_url")
    .eq("country_code", MARKET)
    .in("placement", ["banner", "sponsored"])
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export function adImageUrl(path: string | null) {
  // Demo images ship with the app (public/demo) instead of living in Storage.
  if (path?.startsWith("demo-")) return `/demo/${path}`;
  return path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ads/${path}` : null;
}

/** One paid slot for a search page or a directory section in the current market (null when nothing is sold). */
export async function getSponsoredSlot(placement: "search" | "category", type?: string): Promise<LiveAd | null> {
  let q = createPublicClient()
    .from("ads")
    .select("id,placement,title,subtitle,image_path,link_url,target_type")
    .eq("country_code", MARKET)
    .eq("placement", placement);
  if (placement === "category" && type) q = q.or(`target_type.is.null,target_type.eq.${type}`);
  const { data } = await q.order("target_type", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(1);
  return data?.[0] ?? null;
}
