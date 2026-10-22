"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { parseVideoUrl } from "@/lib/video";
import { isMeal } from "@/lib/nutrition-meta";
import type { FormState } from "@/app/dashboard/actions";

async function requireAdmin() {
  const ctx = await requireUser();
  const { data } = await ctx.supabase.rpc("is_platform_admin");
  if (!data) throw new Error("forbidden");
  return ctx;
}
type Sb = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

const IMG_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
async function uploadImage(supabase: Sb, file: unknown): Promise<{ path?: string; error?: string }> {
  if (!(file instanceof File) || file.size === 0) return {};
  const ext = IMG_EXT[file.type];
  if (!ext) return { error: "الصيغ المسموحة: JPG أو PNG أو WebP" };
  if (file.size > 4 * 1024 * 1024) return { error: "حجم الصورة أكبر من 4MB" };
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("ads").upload(path, file, { contentType: file.type, upsert: false });
  return error ? { error: "تعذّر رفع الصورة" } : { path };
}
const refresh = () => { revalidatePath("/admin/nutrition"); revalidatePath("/no-deprivation", "layout"); revalidatePath("/sitemap.xml"); };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
/** Optional whole number in [0, max]; "" -> null; invalid -> undefined. */
const macro = (fd: FormData, k: string, max: number): number | null | undefined => {
  const s = str(fd, k);
  if (!s) return null;
  const x = Number(s);
  return Number.isInteger(x) && x >= 0 && x <= max ? x : undefined;
};

export async function addNutritionItem(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const title = str(fd, "title");
  if (title.length < 2 || title.length > 80) return { error: "اكتب العنوان (2-80 حرف)" };
  const meal = str(fd, "meal");
  if (!isMeal(meal)) return { error: "اختار الوجبة" };
  const videoRaw = str(fd, "video");
  const body = str(fd, "body");
  let video: string | null = null;
  if (videoRaw) {
    const v = parseVideoUrl(videoRaw);
    if (!v) return { error: "الرابط لازم يكون فيديو من يوتيوب أو إنستغرام أو تيك توك أو فيسبوك" };
    video = v.url;
  }
  if (!video && !body) return { error: "حط رابط فيديو أو اكتب الخطة/الوصفة (واحد على الأقل)" };
  if (body.length > 6000) return { error: "النص أطول من 6000 حرف" };
  const cal = macro(fd, "calories", 5000), pro = macro(fd, "protein", 500), carb = macro(fd, "carbs", 1000), fat = macro(fd, "fat", 500);
  if ([cal, pro, carb, fat].includes(undefined)) return { error: "السعرات والماكروز أرقام صحيحة معقولة" };
  let slug = str(fd, "slug").toLowerCase();
  if (!slug) slug = `food-${crypto.randomUUID().slice(0, 8)}`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 60) return { error: "الـslug إنجليزي صغير وشرطات (مثال: oats-bowl)" };
  const up = await uploadImage(supabase, fd.get("cover"));
  if (up.error) return { error: up.error };
  const { error } = await supabase.from("nutrition_items").insert({
    slug, title_ar: title, meal, kind: video ? "video" : "plan", video_url: video, body_ar: body || null,
    summary_ar: str(fd, "summary").slice(0, 300) || null, cover_path: up.path ?? null, sort_order: 100,
    calories: cal as number | null, protein_g: pro as number | null, carbs_g: carb as number | null, fat_g: fat as number | null,
  });
  if (error) {
    if (up.path) await supabase.storage.from("ads").remove([up.path]);
    return { error: error.message.includes("duplicate") ? "الـslug مستعمل" : "تعذّرت الإضافة" };
  }
  refresh();
  return { ok: "انضاف" };
}

export async function setNutritionActive(id: string, active: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("nutrition_items").update({ is_active: active }).eq("id", id);
  refresh();
}

export async function deleteNutritionItem(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { data: w } = await supabase.from("nutrition_items").select("cover_path").eq("id", id).maybeSingle();
  const { data: ps } = await supabase.from("nutrition_products").select("image_path").eq("item_id", id);
  await supabase.from("nutrition_items").delete().eq("id", id);
  const files = [w?.cover_path, ...(ps ?? []).map((p) => p.image_path)].filter((x): x is string => !!x && !x.startsWith("demo-"));
  if (files.length) await supabase.storage.from("ads").remove(files);
  refresh();
}

export async function addNutritionProduct(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const item = str(fd, "item");
  const name = str(fd, "name");
  if (!/^[0-9a-f-]{36}$/i.test(item)) return { error: "اختار العنصر" };
  if (name.length < 2 || name.length > 80) return { error: "اكتب اسم المنتج" };
  const link = str(fd, "url");
  let ok = false;
  try { ok = new URL(link).protocol === "https:"; } catch {}
  if (!ok || link.length > 500) return { error: "رابط الشراء لازم يبدأ بـhttps://" };
  const up = await uploadImage(supabase, fd.get("image"));
  if (up.error) return { error: up.error };
  const { error } = await supabase.from("nutrition_products").insert({
    item_id: item, name_ar: name, url: link, image_path: up.path ?? null,
    store_label: str(fd, "store").slice(0, 40) || null, price_text: str(fd, "price").slice(0, 30) || null,
  });
  if (error) {
    if (up.path) await supabase.storage.from("ads").remove([up.path]);
    return { error: error.message.includes("too many") ? "الحد 4 منتجات للعنصر" : "تعذّرت الإضافة" };
  }
  refresh();
  return { ok: "انضاف المنتج" };
}

export async function deleteNutritionProduct(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { data: p } = await supabase.from("nutrition_products").select("image_path").eq("id", id).maybeSingle();
  await supabase.from("nutrition_products").delete().eq("id", id);
  if (p?.image_path && !p.image_path.startsWith("demo-")) await supabase.storage.from("ads").remove([p.image_path]);
  refresh();
}
