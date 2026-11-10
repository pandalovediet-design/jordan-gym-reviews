import { createPublicClient } from "@/lib/supabase/public";
import { MARKET } from "@/lib/market";

export type LiveAd = { id: string; placement: string; title: string; subtitle: string | null; image_path: string | null; link_url: string };

export async function listLiveAds(): Promise<LiveAd[]> {
  const { data } = await createPublicClient()
    .from("ads")
    .select("id,placement,title,subtitle,image_path,link_url")
    .eq("country_code", MARKET)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export function adImageUrl(path: string | null) {
  // Demo images ship with the app (public/demo) instead of living in Storage.
  if (path?.startsWith("demo-")) return `/demo/${path}`;
  return path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ads/${path}` : null;
}
