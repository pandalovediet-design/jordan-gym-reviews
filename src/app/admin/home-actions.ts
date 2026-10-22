"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { parseVideoUrl } from "@/lib/video";
import { EQUIPMENT, FOCUS } from "@/lib/home-meta";
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
const refresh = () => { revalidatePath("/admin/home"); revalidatePath("/no-gym", "layout"); revalidatePath("/sitemap.xml"); };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

type WorkoutValues = { slug: string; title_ar: string; focus: string; equipment: string; level: string; video_url: string; steps_ar: string[]; sets_ar: string | null; summary_ar: string | null; mistake_ar: string | null };
function parseWorkout(fd: FormData, slugRequired: boolean): { error: string } | { v: WorkoutValues } {
  const title = str(fd, "title");
  if (title.length < 2 || title.length > 80) return { error: "اكتب اسم التمرين (2-80 حرف)" };
  const vid = parseVideoUrl(str(fd, "video"));
  if (!vid) return { error: "الرابط لازم يكون فيديو من يوتيوب أو إنستغرام أو تيك توك أو فيسبوك (تيك توك: الرابط الكامل مش المختصر)" };
  const steps = str(fd, "steps").split("\n").map((s) => s.trim()).filter(Boolean);
  if (steps.length < 1 || steps.length > 8) return { error: "اكتب من خطوة لـ8 خطوات، كل خطوة بسطر" };
  if (steps.some((s) => s.length < 2 || s.length > 200)) return { error: "كل خطوة بين 2 و200 حرف" };
  const focus = str(fd, "focus"), equipment = str(fd, "equipment"), level = str(fd, "level") || "beginner";
  if (!(FOCUS as readonly string[]).includes(focus) || !(EQUIPMENT as readonly string[]).includes(equipment)) return { error: "اختار العضلة والأداة" };
  let slug = str(fd, "slug").toLowerCase();
  if (!slug && slugRequired) slug = `home-${crypto.randomUUID().slice(0, 8)}`;
  if (slug && (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 60)) return { error: "الـslug إنجليزي صغير وشرطات (مثال: band-row)" };
  return { v: { slug, title_ar: title, focus, equipment, level, video_url: vid.url, steps_ar: steps, sets_ar: str(fd, "sets").slice(0, 40) || null, summary_ar: str(fd, "summary").slice(0, 300) || null, mistake_ar: str(fd, "mistake").slice(0, 200) || null } };
}

export async function addHomeWorkout(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const r = parseWorkout(fd, true);
  if ("error" in r) return { error: r.error };
  const up = await uploadImage(supabase, fd.get("cover"));
  if (up.error) return { error: up.error };
  const { error } = await supabase.from("home_workouts").insert({ ...r.v, cover_path: up.path ?? null, sort_order: 100 });
  if (error) {
    if (up.path) await supabase.storage.from("ads").remove([up.path]);
    return { error: error.message.includes("duplicate") ? "الـslug مستعمل" : "تعذّرت الإضافة" };
  }
  refresh();
  return { ok: "انضاف التمرين" };
}

export async function updateHomeWorkout(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const r = parseWorkout(fd, false);
  if ("error" in r) return { error: r.error };
  const { data: old } = await supabase.from("home_workouts").select("slug,cover_path").eq("id", id).maybeSingle();
  if (!old) return { error: "التمرين مش موجود" };
  const up = await uploadImage(supabase, fd.get("cover"));
  if (up.error) return { error: up.error };
  const { error } = await supabase.from("home_workouts").update({ ...r.v, slug: r.v.slug || old.slug, ...(up.path ? { cover_path: up.path } : {}) }).eq("id", id);
  if (error) {
    if (up.path) await supabase.storage.from("ads").remove([up.path]);
    return { error: error.message.includes("duplicate") ? "الـslug مستعمل" : "تعذّر الحفظ" };
  }
  if (up.path && old.cover_path && !old.cover_path.startsWith("demo-")) await supabase.storage.from("ads").remove([old.cover_path]);
  refresh();
  revalidatePath(`/no-gym/${old.slug}`);
  return { ok: "انحفظ التعديل" };
}

export async function setHomeWorkoutActive(id: string, active: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("home_workouts").update({ is_active: active }).eq("id", id);
  refresh();
}

export async function deleteHomeWorkout(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { data: w } = await supabase.from("home_workouts").select("cover_path").eq("id", id).maybeSingle();
  const { data: ps } = await supabase.from("home_workout_products").select("image_path").eq("workout_id", id);
  await supabase.from("home_workouts").delete().eq("id", id);
  const files = [w?.cover_path, ...(ps ?? []).map((p) => p.image_path)].filter((x): x is string => !!x && !x.startsWith("demo-"));
  if (files.length) await supabase.storage.from("ads").remove(files);
  refresh();
}

export async function addHomeProduct(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const workout = str(fd, "workout");
  const name = str(fd, "name");
  if (!/^[0-9a-f-]{36}$/i.test(workout)) return { error: "اختار التمرين" };
  if (name.length < 2 || name.length > 80) return { error: "اكتب اسم المنتج" };
  const link = str(fd, "url");
  let ok = false;
  try { ok = new URL(link).protocol === "https:"; } catch {}
  if (!ok || link.length > 500) return { error: "رابط الشراء لازم يبدأ بـhttps://" };
  const up = await uploadImage(supabase, fd.get("image"));
  if (up.error) return { error: up.error };
  const { error } = await supabase.from("home_workout_products").insert({
    workout_id: workout, name_ar: name, url: link, image_path: up.path ?? null,
    store_label: str(fd, "store").slice(0, 40) || null, price_text: str(fd, "price").slice(0, 30) || null,
  });
  if (error) {
    if (up.path) await supabase.storage.from("ads").remove([up.path]);
    return { error: error.message.includes("too many") ? "الحد 4 منتجات للتمرين" : "تعذّرت الإضافة" };
  }
  refresh();
  return { ok: "انضاف المنتج" };
}

export async function deleteHomeProduct(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { data: p } = await supabase.from("home_workout_products").select("image_path").eq("id", id).maybeSingle();
  await supabase.from("home_workout_products").delete().eq("id", id);
  if (p?.image_path && !p.image_path.startsWith("demo-")) await supabase.storage.from("ads").remove([p.image_path]);
  refresh();
}
