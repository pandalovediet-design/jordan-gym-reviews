import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { adImageUrl } from "@/lib/ads";
import { parseVideoUrl } from "@/lib/video";

export type NutritionItem = {
  id: string; slug: string; title: string; meal: string; kind: string; summary: string | null; body: string | null;
  video_url: string | null; cover: string | null; platform: string | null;
  calories: number | null; protein: number | null; carbs: number | null; fat: number | null;
};
const COLS = "id,slug,title_ar,meal,kind,summary_ar,body_ar,video_url,cover_path,platform,calories,protein_g,carbs_g,fat_g";
type Row = { id: string; slug: string; title_ar: string; meal: string; kind: string; summary_ar: string | null; body_ar: string | null; video_url: string | null; cover_path: string | null; platform: string | null; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null };
const shape = (r: Row): NutritionItem => ({
  id: r.id, slug: r.slug, title: r.title_ar, meal: r.meal, kind: r.kind, summary: r.summary_ar, body: r.body_ar, video_url: r.video_url, platform: r.platform,
  calories: r.calories, protein: r.protein_g, carbs: r.carbs_g, fat: r.fat_g,
  cover: adImageUrl(r.cover_path) ?? (r.video_url ? parseVideoUrl(r.video_url)?.thumb ?? null : null),
});

export async function listNutrition(): Promise<NutritionItem[]> {
  const { data } = await createPublicClient().from("nutrition_items").select(COLS).order("sort_order").order("created_at", { ascending: false }).limit(500);
  return (data ?? []).map(shape);
}

export type NutritionProduct = { id: string; name: string; store: string | null; price: string | null; image: string | null };
export type NutritionFull = NutritionItem & { products: NutritionProduct[]; related: { slug: string; title: string }[] };

export async function getNutrition(slug: string): Promise<NutritionFull | null> {
  const db = createPublicClient();
  const { data: r } = await db.from("nutrition_items").select(COLS).eq("slug", slug).maybeSingle();
  if (!r) return null;
  const [{ data: prods }, { data: rel }] = await Promise.all([
    db.from("nutrition_products").select("id,name_ar,store_label,price_text,image_path").eq("item_id", r.id).order("sort_order").order("created_at"),
    db.from("nutrition_items").select("slug,title_ar").neq("id", r.id).eq("meal", r.meal).order("sort_order").limit(6),
  ]);
  return {
    ...shape(r),
    products: (prods ?? []).map((p) => ({ id: p.id, name: p.name_ar, store: p.store_label, price: p.price_text, image: adImageUrl(p.image_path) })),
    related: (rel ?? []).map((x) => ({ slug: x.slug, title: x.title_ar })),
  };
}
