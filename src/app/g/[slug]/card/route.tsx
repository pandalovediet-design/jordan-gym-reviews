import { createPublicClient } from "@/lib/supabase/public";
import { renderCard, loadCardPhoto } from "@/lib/share-card";
import { asGlow } from "@/lib/format";

export const runtime = "nodejs";
export const revalidate = 3600;

/** /g/<slug>/card (feed 1080x1350) or ?s=1 (story 1080x1920). */
export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const story = new URL(req.url).searchParams.get("s") === "1";
  const db = createPublicClient();
  const { data: o } = await db.from("organizations_listing")
    .select("id,glow_color,slug,name_ar,type,city,area,min_price_jod,verified_at,women_access,has_kids_area,kids_friendly,has_mosque,free_trial_note")
    .eq("slug", decodeURIComponent(slug)).maybeSingle();
  if (!o) return new Response("not found", { status: 404 });
  const { data: m } = await db.from("organization_media").select("storage_path").eq("organization_id", o.id as string).order("is_cover", { ascending: false }).order("sort_order").limit(1).maybeSingle();
  const photo = await loadCardPhoto(m?.storage_path, story);
  return renderCard({ ...o, photo, glow: asGlow(o.glow_color) }, story);
}
