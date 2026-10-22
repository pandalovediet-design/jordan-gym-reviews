import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

export type NamedSeries = { id: string; title: string; description: string | null; ids: string[] };

export async function listSeries(kind: "home" | "nutrition"): Promise<NamedSeries[]> {
  const { data } = await createPublicClient().from("named_series").select("id,title_ar,description_ar,item_ids").eq("kind", kind).order("sort_order").order("created_at", { ascending: false }).limit(30);
  return (data ?? []).map((r) => ({ id: r.id, title: r.title_ar, description: r.description_ar, ids: r.item_ids }));
}
