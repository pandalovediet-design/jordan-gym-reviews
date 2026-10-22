import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { adImageUrl } from "@/lib/ads";
import { parseVideoUrl } from "@/lib/video";

export type HomeWorkout = {
  id: string; slug: string; title: string; focus: string; equipment: string; level: string; sets: string | null;
  summary: string | null; video_url: string; cover: string | null; platform: string | null;
};
const COLS = "id,slug,title_ar,focus,equipment,level,sets_ar,summary_ar,video_url,cover_path,platform";
type Row = { id: string; slug: string; title_ar: string; focus: string; equipment: string; level: string; sets_ar: string | null; summary_ar: string | null; video_url: string; cover_path: string | null; platform: string | null };
const shape = (r: Row): HomeWorkout => ({
  id: r.id, slug: r.slug, title: r.title_ar, focus: r.focus, equipment: r.equipment, level: r.level, sets: r.sets_ar, summary: r.summary_ar,
  video_url: r.video_url, platform: r.platform,
  cover: adImageUrl(r.cover_path) ?? parseVideoUrl(r.video_url)?.thumb ?? null,
});

export async function listHomeWorkouts(): Promise<HomeWorkout[]> {
  const { data } = await createPublicClient().from("home_workouts").select(COLS).order("sort_order").order("created_at", { ascending: false }).limit(500);
  return (data ?? []).map(shape);
}

export type HomeProduct = { id: string; name: string; store: string | null; price: string | null; image: string | null };
export type HomeWorkoutFull = HomeWorkout & { steps: string[]; mistake: string | null; products: HomeProduct[]; related: { slug: string; title: string }[] };

export async function getHomeWorkout(slug: string): Promise<HomeWorkoutFull | null> {
  const db = createPublicClient();
  const { data: r } = await db.from("home_workouts").select(`${COLS},steps_ar,mistake_ar`).eq("slug", slug).maybeSingle();
  if (!r) return null;
  const [{ data: prods }, { data: rel }] = await Promise.all([
    db.from("home_workout_products").select("id,name_ar,store_label,price_text,image_path").eq("workout_id", r.id).order("sort_order").order("created_at"),
    db.from("home_workouts").select("slug,title_ar").neq("id", r.id).or(`equipment.eq.${r.equipment},focus.eq.${r.focus}`).order("sort_order").limit(6),
  ]);
  return {
    ...shape(r), steps: r.steps_ar, mistake: r.mistake_ar,
    products: (prods ?? []).map((p) => ({ id: p.id, name: p.name_ar, store: p.store_label, price: p.price_text, image: adImageUrl(p.image_path) })),
    related: (rel ?? []).map((x) => ({ slug: x.slug, title: x.title_ar })),
  };
}
