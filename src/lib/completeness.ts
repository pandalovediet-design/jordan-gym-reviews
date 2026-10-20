import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/** What a page needs before it can be sent for review (thin pages hurt both users and SEO). */
export async function missingForPublish(supabase: SupabaseClient<Database>, id: string): Promise<string[]> {
  const [{ data: org }, media, services, products, menu] = await Promise.all([
    supabase.from("organizations").select("type,description_ar,whatsapp,phone,address,area,category_id").eq("id", id).maybeSingle(),
    supabase.from("organization_media").select("id", { count: "exact", head: true }).eq("organization_id", id),
    supabase.from("organization_services").select("id", { count: "exact", head: true }).eq("organization_id", id),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("organization_id", id),
    supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("organization_id", id),
  ]);
  if (!org) return ["النشاط غير موجود"];
  const missing: string[] = [];
  if ((org.description_ar ?? "").trim().length < 40) missing.push("وصف لا يقل عن 40 حرف");
  if (!org.whatsapp && !org.phone) missing.push("رقم واتساب أو هاتف");
  if (!org.address && !org.area) missing.push("العنوان أو المنطقة");
  if (!org.category_id) missing.push("اختيار التصنيف");
  if ((media.count ?? 0) < 1) missing.push("صورة واحدة على الأقل");
  if (org.type === "healthy_food") {
    if ((menu.count ?? 0) < 1) missing.push("وجبة واحدة على الأقل بالقائمة");
  } else if (org.type === "store") {
    if ((products.count ?? 0) < 1) missing.push("منتج واحد على الأقل");
  } else if ((services.count ?? 0) < 1) missing.push("خدمة أو سعر واحد على الأقل");
  return missing;
}
