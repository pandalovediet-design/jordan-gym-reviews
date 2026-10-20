import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/** What a page needs before it can be sent for review (thin pages hurt both users and SEO). */
export async function missingForPublish(supabase: SupabaseClient<Database>, id: string): Promise<string[]> {
  const { data: org } = await supabase.from("organizations").select("whatsapp,phone,category_id").eq("id", id).maybeSingle();
  if (!org) return ["النشاط غير موجود"];
  // Only what a visitor truly needs to reach the business. Everything else is a suggestion (see suggestionsFor).
  const missing: string[] = [];
  if (!org.whatsapp && !org.phone) missing.push("رقم واتساب أو هاتف");
  if (!org.category_id) missing.push("اختيار التصنيف");
  return missing;
}

/** Nice-to-have items shown as tips; they never block sending for review. */
export async function suggestionsFor(supabase: SupabaseClient<Database>, id: string): Promise<string[]> {
  const [{ data: org }, media, services, products, menu] = await Promise.all([
    supabase.from("organizations").select("type,description_ar,address,area").eq("id", id).maybeSingle(),
    supabase.from("organization_media").select("id", { count: "exact", head: true }).eq("organization_id", id),
    supabase.from("organization_services").select("id", { count: "exact", head: true }).eq("organization_id", id),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("organization_id", id),
    supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("organization_id", id),
  ]);
  if (!org) return [];
  const tips: string[] = [];
  if ((org.description_ar ?? "").trim().length < 40) tips.push("وصف قصير عن نشاطك");
  if (!org.address && !org.area) tips.push("العنوان أو المنطقة");
  if ((media.count ?? 0) < 1) tips.push("صورة أو أكثر");
  if (org.type === "healthy_food") { if ((menu.count ?? 0) < 1) tips.push("وجبات بالقائمة"); }
  else if (org.type === "store") { if ((products.count ?? 0) < 1) tips.push("منتجات"); }
  else if ((services.count ?? 0) < 1) tips.push("الأسعار والخدمات");
  return tips;
}
