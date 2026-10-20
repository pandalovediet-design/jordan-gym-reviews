"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/app/dashboard/actions";

async function requireAdmin() {
  const ctx = await requireUser();
  const { data } = await ctx.supabase.rpc("is_platform_admin");
  if (!data) throw new Error("forbidden");
  return ctx;
}
type Sb = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

const IMG_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
async function uploadAdsImage(supabase: Sb, file: unknown): Promise<{ path?: string; error?: string }> {
  if (!(file instanceof File) || file.size === 0) return {};
  const ext = IMG_EXT[file.type];
  if (!ext) return { error: "الصيغ المسموحة: JPG أو PNG أو WebP" };
  if (file.size > 4 * 1024 * 1024) return { error: "حجم الصورة أكبر من 4MB" };
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("ads").upload(path, file, { contentType: file.type, upsert: false });
  return error ? { error: "تعذّر رفع الصورة" } : { path };
}
const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
const optNum = z.string().optional().transform((v) => (v ? Number(v) : null));
const MAPS_RE = /^https:\/\/(maps\.app\.goo\.gl\/|goo\.gl\/maps\/|(www\.|maps\.)?google\.[a-z.]+\/maps)/i;

// ---------------------------------------------------------------- trails
const trailSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "الرمز بالإنجليزي صغير وأرقام وشرطات فقط").min(3).max(60),
  name_ar: z.string().trim().min(2, "اكتب اسم المسار").max(120),
  region: z.string().trim().min(2, "اكتب المنطقة").max(60),
  trail_type: z.enum(["hiking", "walking", "running"]),
  difficulty: z.enum(["easy", "moderate", "hard", "expert"]),
  distance_km: optNum.pipe(z.number().gt(0, "المسافة غير صحيحة").max(500).nullable()),
  duration_min: optNum.pipe(z.number().int().min(1).max(10000).nullable()),
  elevation_gain_m: optNum.pipe(z.number().int().min(0).max(10000).nullable()),
  description_ar: opt(3000),
  tips_ar: opt(1000),
  maps_url: opt(500),
});

export async function addTrail(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const p = trailSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  if (p.data.maps_url && !MAPS_RE.test(p.data.maps_url)) return { error: "رابط الموقع لازم يكون من قوقل ماب." };
  const up = await uploadAdsImage(supabase, fd.get("image"));
  if (up.error) return { error: up.error };
  const { error } = await supabase.from("trails").insert({ ...p.data, image_path: up.path ?? null, is_published: true });
  if (error) {
    if (up.path) await supabase.storage.from("ads").remove([up.path]);
    return { error: error.code === "23505" ? "هاد الرمز مستخدم." : "تعذّرت الإضافة" };
  }
  revalidatePath("/admin/trails");
  revalidatePath("/trails");
  return { ok: "تمت إضافة المسار ونُشر" };
}

export async function setTrailPublished(id: string, published: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("trails").update({ is_published: published }).eq("id", id);
  revalidatePath("/admin/trails");
  revalidatePath("/trails");
}

export async function deleteTrail(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("trails").select("image_path").eq("id", id).maybeSingle();
  await supabase.from("trails").delete().eq("id", id);
  if (data?.image_path && !data.image_path.startsWith("demo-")) await supabase.storage.from("ads").remove([data.image_path]);
  revalidatePath("/admin/trails");
  revalidatePath("/trails");
}

// ---------------------------------------------------------------- partners
const partnerSchema = z.object({
  name_ar: z.string().trim().min(2, "اكتب اسم الشريك").max(80),
  link_url: opt(500),
  organization_id: z.string().optional().transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null)),
  ends_at: z.string().optional().transform((v) => v || null),
});

export async function addPartner(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const p = partnerSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  if (p.data.link_url && !/^https:\/\//i.test(p.data.link_url)) return { error: "الرابط لازم يبدأ بـ https://" };
  const up = await uploadAdsImage(supabase, fd.get("logo"));
  if (up.error) return { error: up.error };
  if (!up.path) return { error: "ارفع شعار الشريك" };
  const ends = p.data.ends_at ? new Date(p.data.ends_at) : null;
  ends?.setHours(23, 59, 59);
  const { error } = await supabase.from("partners").insert({
    name_ar: p.data.name_ar, link_url: p.data.link_url, organization_id: p.data.organization_id, logo_path: up.path, ends_at: ends ? ends.toISOString() : null,
  });
  if (error) {
    await supabase.storage.from("ads").remove([up.path]);
    return { error: "تعذّرت الإضافة" };
  }
  revalidatePath("/admin/partners");
  revalidatePath("/");
  return { ok: "تمت إضافة الشريك" };
}

export async function setPartnerActive(id: string, active: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("partners").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin/partners");
  revalidatePath("/");
}

export async function deletePartner(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("partners").select("logo_path").eq("id", id).maybeSingle();
  await supabase.from("partners").delete().eq("id", id);
  if (data?.logo_path && !data.logo_path.startsWith("demo-")) await supabase.storage.from("ads").remove([data.logo_path]);
  revalidatePath("/admin/partners");
  revalidatePath("/");
}

// ---------------------------------------------------------------- flash slots (the ad space)
const slotSchema = z.object({
  organization_id: z.string().regex(/^[0-9a-f-]{36}$/i, "اختر النشاط"),
  starts_at: z.string().min(1, "اكتب وقت البداية"),
  hours: z.coerce.number().int().min(1, "المدة من 1 إلى 48 ساعة").max(48, "المدة من 1 إلى 48 ساعة"),
});

export async function createFlashSlot(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const p = slotSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const start = new Date(p.data.starts_at);
  if (Number.isNaN(+start)) return { error: "وقت البداية غير صحيح" };
  const end = new Date(+start + p.data.hours * 3_600_000);
  const { error } = await supabase.from("flash_slots").insert({ organization_id: p.data.organization_id, starts_at: start.toISOString(), ends_at: end.toISOString() });
  if (error) return { error: error.message.includes("taken") ? "كل المساحات الست محجوزة بهالفترة." : "تعذّر إنشاء المساحة" };
  revalidatePath("/admin/flash");
  revalidatePath("/");
  return { ok: "تم تفعيل المساحة. صاحب النشاط بيعبي عرضه من لوحته." };
}

const renewSchema = z.object({ hours: z.coerce.number().int().min(1, "المدة من 1 إلى 48 ساعة").max(48, "المدة من 1 إلى 48 ساعة") });

/** Restart a slot from now for the given number of hours (≤ 48). */
export async function renewFlashSlot(id: string, fd: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const p = renewSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return;
  const start = new Date();
  await supabase.from("flash_slots").update({ starts_at: start.toISOString(), ends_at: new Date(+start + p.data.hours * 3_600_000).toISOString() }).eq("id", id);
  revalidatePath("/admin/flash");
  revalidatePath("/");
}

export async function deleteFlashSlot(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("flash_slots").delete().eq("id", id);
  revalidatePath("/admin/flash");
  revalidatePath("/");
}
