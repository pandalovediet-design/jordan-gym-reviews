import { createPublicClient } from "@/lib/supabase/public";

export type LiveAd = { id: string; placement: string; title: string; subtitle: string | null; image_path: string | null; link_url: string };

export async function listLiveAds(): Promise<LiveAd[]> {
  const { data } = await createPublicClient()
    .from("ads")
    .select("id,placement,title,subtitle,image_path,link_url")
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export function adImageUrl(path: string | null) {
  return path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ads/${path}` : null;
}
