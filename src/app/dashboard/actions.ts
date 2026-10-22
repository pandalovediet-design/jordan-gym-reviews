"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { notifyAdmin } from "@/lib/notify";
import { requireUser } from "@/lib/auth";
import { missingForPublish } from "@/lib/completeness";
import { resolveMapsCoords } from "@/lib/maps";
import { parseVideoUrl } from "@/lib/video";

export type FormState = { error?: string; ok?: string } | undefined;
const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
const num = z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().nullable());

const branchField = z.string().optional().transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null));

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);

const createSchema = z.object({
  name_ar: z.string().trim().min(2, "اكتب اسم النشاط").max(80),
  type: z.enum(["gym", "independent_coach", "sports_facility", "store", "nutritionist", "healthy_food", "sports_health"]),
  city: z.string().trim().min(2, "اكتب المدينة").max(40),
  area: z.string().trim().max(60).optional().transform((v) => v || null),
  category_id: z.string().uuid("اختر التصنيف"),
});

export async function createOrg(_: FormState, fd: FormData): Promise<FormState> {
  const p = createSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { supabase, user } = await requireUser();
  const base = slugify(p.data.name_ar) || (p.data.type === "store" ? "store" : p.data.type === "independent_coach" ? "coach" : p.data.type === "nutritionist" ? "nutritionist" : p.data.type === "healthy_food" ? "food" : p.data.type === "sports_health" ? "clinic" : "gym");
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await supabase
    .from("organizations")
    .insert({ ...p.data, slug, created_by: user.id })
    .select("id").single();
  if (error) return { error: error.message.includes("category") ? "التصنيف لا يناسب نوع النشاط." : error.message.includes("max") || error.message.includes("limit") ? "وصلت الحد الأقصى من الأنشطة." : "تعذّر إنشاء النشاط." };
  await notifyAdmin(`🏷️ نشاط جديد: ${p.data.name_ar}\nالنوع: ${p.data.type} · ${p.data.city}\n${user.email ?? ""}`);
  redirect(`/dashboard/${data.id}`);
}

function intl(v: string | null | undefined) {
  if (!v) return null;
  let d = v.replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = "+" + d.slice(2);
  if (d.startsWith("0")) d = "+962" + d.slice(1);
  if (/^962/.test(d)) d = "+" + d;
  return d;
}

const profileSchema = z.object({
  name_ar: z.string().trim().min(2).max(80),
  name_en: opt(80),
  description_ar: opt(2000),
  city: z.string().trim().min(2).max(40),
  area: opt(60),
  address: opt(200),
  phone: opt(20),
  whatsapp: opt(20),
  instagram: opt(60),
  website: opt(200),
  category_id: z.string().uuid().optional().transform((v) => v || null),
  women_access: z.enum(["none", "women_only", "women_hours"]).default("none"),
  women_hours_note: opt(200),
  has_mosque: z.string().optional().transform((v) => v === "on"),
  no_music: z.string().optional().transform((v) => v === "on"),
  maps_url: opt(500),
  free_trial_note: opt(120),
  video_url: opt(300),
  delivery_areas: opt(300),
  license_number: opt(60),
  license_authority: opt(120),
});

export async function updateProfile(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const p = profileSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "تأكد من البيانات المدخلة" };
  const { supabase } = await requireUser();
  const data = { ...p.data, phone: intl(p.data.phone), whatsapp: intl(p.data.whatsapp), instagram: p.data.instagram?.replace(/^@/, "") ?? null };
  if (data.maps_url && !/^https:\/\/(maps\.app\.goo\.gl\/|goo\.gl\/maps\/|(www\.|maps\.)?google\.[a-z.]+\/maps)/i.test(data.maps_url)) return { error: "رابط الموقع لازم يكون من قوقل ماب (maps.app.goo.gl أو google.com/maps)." };
  if (data.video_url && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be|instagram\.com|tiktok\.com)\//i.test(data.video_url)) return { error: "رابط الفيديو لازم يكون من يوتيوب أو إنستغرام أو تيك توك (يبدأ بـ https://)." };
  if (data.women_access !== "women_hours") data.women_hours_note = null;
  const extra = fd.has("delivery_present") ? { delivery_modes: fd.getAll("delivery_modes").map(String).filter((m) => ["own_delivery", "apps", "pickup"].includes(m)) } : {};
  const coords = data.maps_url ? await resolveMapsCoords(data.maps_url) : null;
  Object.assign(data, { latitude: coords?.lat ?? null, longitude: coords?.lng ?? null }, extra);
  const { error } = await supabase.from("organizations").update(data).eq("id", id);
  if (error) return { error: error.message.includes("category") ? "التصنيف لا يناسب نوع النشاط." : "تعذّر الحفظ. تأكد من صيغة الهاتف والواتساب والموقع (يبدأ بـ https://)." };
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تم الحفظ" };
}

const classSchema = z.object({
  title_ar: z.string().trim().min(2, "اكتب اسم الحصة").max(80),
  weekday: z.coerce.number().int().min(0).max(6),
  starts_at: z.string().regex(/^\d{2}:\d{2}$/, "اكتب وقت البداية"),
  ends_at: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")).transform((v) => v || null),
  women_only: z.string().optional().transform((v) => v === "on"),
  note: opt(200),
  branch_id: branchField,
});

export async function addClass(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const p = classSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("org_classes").insert({ ...p.data, organization_id: id });
  if (error) return { error: "تعذّرت الإضافة" };
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تمت إضافة الحصة" };
}

export async function deleteClass(id: string, classId: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("org_classes").delete().eq("id", classId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}`);
}

export async function submitForReview(id: string): Promise<void> {
  const { supabase } = await requireUser();
  if ((await missingForPublish(supabase, id)).length > 0) return;
  const { data: sent } = await supabase.from("organizations").update({ status: "pending" }).eq("id", id).eq("status", "draft").select("name_ar").maybeSingle();
  if (sent) await notifyAdmin(`📝 نشاط بانتظار مراجعتك: ${sent.name_ar}\nافتح /admin لاعتماده`);
  revalidatePath(`/dashboard/${id}`);
}

const serviceSchema = z.object({
  name_ar: z.string().trim().min(2, "اكتب اسم الخدمة").max(80),
  price_jod: num,
  billing_period: z.enum(["session", "day", "week", "month", "quarter", "year", ""]).transform((v) => v || null),
  branch_id: branchField,
});

export async function addService(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const p = serviceSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  if (p.data.price_jod != null && (p.data.price_jod < 0 || p.data.price_jod > 100000)) return { error: "السعر غير منطقي" };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("organization_services").insert({ ...p.data, organization_id: id });
  if (error) return { error: "تعذّرت الإضافة" };
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تمت الإضافة" };
}

export async function deleteService(id: string, serviceId: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("organization_services").delete().eq("id", serviceId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}`);
}

export async function saveHours(id: string, branchId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const rows = [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const closed = fd.get(`closed_${d}`) === "on";
    const o = String(fd.get(`open_${d}`) || ""), c = String(fd.get(`close_${d}`) || "");
    return { organization_id: id, branch_id: branchId, weekday: d, is_closed: closed || !o || !c, opens_at: closed || !o ? null : o, closes_at: closed || !c ? null : c };
  });
  const { error } = await supabase.from("organization_hours").upsert(rows, { onConflict: "branch_id,weekday" });
  if (error) return { error: "تعذّر حفظ الدوام" };
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تم حفظ الدوام" };
}

// ---------------------------------------------------------------- branches
const branchSchema = z.object({
  name_ar: z.string().trim().min(2, "اكتب اسم الفرع").max(80),
  city: z.string().trim().min(2, "اكتب مدينة الفرع").max(40),
  area: opt(60),
  address: opt(200),
  phone: opt(20),
  whatsapp: opt(20),
  maps_url: opt(500),
  women_access: z.enum(["none", "women_only", "women_hours"]).default("none"),
  women_hours_note: opt(200),
});
const MAPS_RE = /^https:\/\/(maps\.app\.goo\.gl\/|goo\.gl\/maps\/|(www\.|maps\.)?google\.[a-z.]+\/maps)/i;

async function branchRow(fd: FormData) {
  const p = branchSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message } as const;
  const d = { ...p.data, phone: intl(p.data.phone), whatsapp: intl(p.data.whatsapp) };
  if (d.maps_url && !MAPS_RE.test(d.maps_url)) return { error: "رابط الموقع لازم يكون من قوقل ماب." } as const;
  if (d.women_access !== "women_hours") d.women_hours_note = null;
  const coords = d.maps_url ? await resolveMapsCoords(d.maps_url) : null;
  return { data: { ...d, latitude: coords?.lat ?? null, longitude: coords?.lng ?? null } } as const;
}

export async function addBranch(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const r = await branchRow(fd);
  if ("error" in r) return { error: r.error };
  const { supabase } = await requireUser();
  const { count } = await supabase.from("org_branches").select("id", { count: "exact", head: true }).eq("organization_id", id);
  if ((count ?? 0) >= 50) return { error: "وصلت الحد الأقصى من الفروع" };
  const { error } = await supabase.from("org_branches").insert({ ...r.data, organization_id: id, sort_order: count ?? 0 });
  if (error) return { error: "تعذّرت إضافة الفرع. تأكد من صيغة الهاتف والواتساب." };
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تمت إضافة الفرع. هسا بتقدر تحط له أسعار وعروض ودوام." };
}

export async function updateBranch(id: string, branchId: string, _: FormState, fd: FormData): Promise<FormState> {
  const r = await branchRow(fd);
  if ("error" in r) return { error: r.error };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("org_branches").update(r.data).eq("id", branchId).eq("organization_id", id).eq("is_main", false);
  if (error) return { error: "تعذّر الحفظ. تأكد من صيغة الهاتف والواتساب." };
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تم حفظ الفرع" };
}

export async function deleteBranch(id: string, branchId: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("org_branches").delete().eq("id", branchId).eq("organization_id", id).eq("is_main", false);
  revalidatePath(`/dashboard/${id}`);
}

export async function setBranchActive(id: string, branchId: string, active: boolean): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("org_branches").update({ is_active: active }).eq("id", branchId).eq("organization_id", id).eq("is_main", false);
  revalidatePath(`/dashboard/${id}`);
}

// ---------------------------------------------------------------- trainers
const trainerSchema = z.object({
  name_ar: z.string().trim().min(2, "اكتب اسم المدرب").max(80),
  title_ar: opt(80),
  bio_ar: opt(1000),
  specialties: opt(200),
  education: opt(80),
  education_place: opt(80),
  is_head: z.string().optional().transform((v) => v === "on"),
  experience_years: z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().int("سنوات الخبرة رقم صحيح").min(0, "سنوات الخبرة من 0 إلى 60").max(60, "سنوات الخبرة من 0 إلى 60").nullable()),
  branch_id: branchField,
});

export async function addTrainer(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const { photo, ...rest } = Object.fromEntries(fd);
  const p = trainerSchema.safeParse(rest);
  if (!p.success) return { error: p.error.issues[0].message };
  const { supabase } = await requireUser();
  const { count } = await supabase.from("org_trainers").select("id", { count: "exact", head: true }).eq("organization_id", id);
  if ((count ?? 0) >= 60) return { error: "وصلت الحد الأقصى من المدربين" };
  let photo_path: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const up = await uploadImage(supabase, id, photo);
    if (up.error) return { error: up.error };
    photo_path = up.path!;
  }
  if (p.data.is_head) await supabase.from("org_trainers").update({ is_head: false }).eq("organization_id", id);
  const { error } = await supabase.from("org_trainers").insert({ ...p.data, organization_id: id, photo_path, sort_order: count ?? 0 });
  if (error) {
    if (photo_path) await supabase.storage.from("org-media").remove([photo_path]);
    return { error: "تعذّرت إضافة المدرب" };
  }
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تمت إضافة المدرب" };
}

export async function deleteTrainer(id: string, trainerId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { data: old } = await supabase.from("org_trainers").select("photo_path").eq("id", trainerId).eq("organization_id", id).maybeSingle();
  if (old?.photo_path && !old.photo_path.split("/").pop()?.startsWith("demo-")) await supabase.storage.from("org-media").remove([old.photo_path]);
  await supabase.from("org_trainers").delete().eq("id", trainerId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}`);
}

export async function setProductAvailability(id: string, productId: string, availability: "available" | "limited" | "out_of_stock" | "unknown"): Promise<void> {
  if (!["available", "limited", "out_of_stock", "unknown"].includes(availability)) return;
  const { supabase } = await requireUser();
  await supabase.from("products").update({ availability }).eq("id", productId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}`);
}

// ---------------------------------------------------------------- media
const MAX_IMG = 4 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function uploadMedia(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "اختر صورة" };
  const ext = EXT[file.type];
  if (!ext) return { error: "الصيغ المسموحة: JPG أو PNG أو WebP" };
  if (file.size > MAX_IMG) return { error: "حجم الصورة أكبر من 4MB" };
  const { supabase } = await requireUser();
  const path = `${id}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("org-media").upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { error: "تعذّر رفع الصورة" };
  const { count } = await supabase.from("organization_media").select("id", { count: "exact", head: true }).eq("organization_id", id);
  if ((count ?? 0) >= 12) {
    await supabase.storage.from("org-media").remove([path]);
    return { error: "الحد الأقصى 12 صورة" };
  }
  const alt = String(fd.get("alt_text") || "").trim().slice(0, 150) || null;
  const { error } = await supabase.from("organization_media").insert({ organization_id: id, storage_path: path, alt_text: alt, is_cover: (count ?? 0) === 0, sort_order: count ?? 0 });
  if (error) {
    await supabase.storage.from("org-media").remove([path]);
    return { error: "تعذّر حفظ الصورة" };
  }
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تم رفع الصورة" };
}

/** The business's main image (shown on cards and as the page cover). Marked with sort_order = -1; replaces the previous one. */
export async function setMainImage(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "اختر صورة" };
  const ext = EXT[file.type];
  if (!ext) return { error: "الصيغ المسموحة: JPG أو PNG أو WebP" };
  if (file.size > MAX_IMG) return { error: "حجم الصورة أكبر من 4MB" };
  const { supabase } = await requireUser();
  const path = `${id}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("org-media").upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { error: "تعذّر رفع الصورة" };
  const { data: old } = await supabase.from("organization_media").select("id,storage_path").eq("organization_id", id).lt("sort_order", 0);
  await supabase.from("organization_media").update({ is_cover: false }).eq("organization_id", id);
  const { error } = await supabase.from("organization_media").insert({ organization_id: id, storage_path: path, alt_text: null, is_cover: true, sort_order: -1 });
  if (error) {
    await supabase.storage.from("org-media").remove([path]);
    return { error: "تعذّر حفظ الصورة" };
  }
  if (old?.length) {
    await supabase.from("organization_media").delete().in("id", old.map((o) => o.id));
    await supabase.storage.from("org-media").remove(old.map((o) => o.storage_path));
  }
  revalidatePath(`/dashboard/${id}`);
  revalidatePath("/");
  return { ok: "تم تحديث الصورة الرئيسية" };
}

export async function deleteMedia(id: string, mediaId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("organization_media").select("storage_path").eq("id", mediaId).eq("organization_id", id).maybeSingle();
  if (!data) return;
  await supabase.from("organization_media").delete().eq("id", mediaId).eq("organization_id", id);
  await supabase.storage.from("org-media").remove([data.storage_path]);
  revalidatePath(`/dashboard/${id}`);
}

// ---------------------------------------------------------------- products
const productSchema = z.object({
  name_ar: z.string().trim().min(2, "اكتب اسم المنتج").max(120),
  brand: opt(80),
  category_id: z.string().uuid("اختر الفئة"),
  price_jod: z.coerce.number({ message: "اكتب السعر" }).min(0).max(100000),
  old_price_jod: z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().min(0).max(100000).nullable()),
  availability: z.enum(["available", "limited", "out_of_stock", "unknown"]),
  description_ar: opt(2000),
  ingredients: opt(2000),
  branch_id: branchField,
});

type Sb = Awaited<ReturnType<typeof requireUser>>["supabase"];

async function uploadImage(supabase: Sb, id: string, file: File): Promise<{ path?: string; error?: string }> {
  const ext = EXT[file.type];
  if (!ext) return { error: "الصيغ المسموحة: JPG أو PNG أو WebP" };
  if (file.size > MAX_IMG) return { error: "حجم الصورة أكبر من 4MB" };
  const path = `${id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("org-media").upload(path, file, { contentType: file.type, upsert: false });
  return error ? { error: "تعذّر رفع الصورة" } : { path };
}

export async function addProduct(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const { image, ...rest } = Object.fromEntries(fd);
  const p = productSchema.safeParse(rest);
  if (!p.success) return { error: p.error.issues[0].message };
  if (p.data.old_price_jod != null && p.data.old_price_jod <= p.data.price_jod) return { error: "السعر قبل الخصم لازم يكون أكبر من السعر الحالي" };
  const { supabase } = await requireUser();
  let image_path: string | null = null;
  if (image instanceof File && image.size > 0) {
    const up = await uploadImage(supabase, id, image);
    if (up.error) return { error: up.error };
    image_path = up.path!;
  }
  const { error } = await supabase.from("products").insert({ ...p.data, organization_id: id, image_path });
  if (error) {
    if (image_path) await supabase.storage.from("org-media").remove([image_path]);
    return { error: "تعذّرت الإضافة (المنتجات للمتاجر فقط)" };
  }
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تمت الإضافة. المكملات بتظهر بعد موافقة الإدارة." };
}

export async function setProductImage(id: string, productId: string, _: FormState, fd: FormData): Promise<FormState> {
  const file = fd.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "اختر صورة" };
  const { supabase } = await requireUser();
  const { data: old } = await supabase.from("products").select("image_path").eq("id", productId).eq("organization_id", id).maybeSingle();
  if (!old) return { error: "المنتج غير موجود" };
  const up = await uploadImage(supabase, id, file);
  if (up.error) return { error: up.error };
  const { error } = await supabase.from("products").update({ image_path: up.path! }).eq("id", productId).eq("organization_id", id);
  if (error) {
    await supabase.storage.from("org-media").remove([up.path!]);
    return { error: "تعذّر حفظ الصورة" };
  }
  if (old.image_path && !old.image_path.split("/").pop()?.startsWith("demo-")) await supabase.storage.from("org-media").remove([old.image_path]);
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تم تحديث الصورة" };
}

export async function deleteProduct(id: string, productId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { data: old } = await supabase.from("products").select("image_path").eq("id", productId).eq("organization_id", id).maybeSingle();
  if (old?.image_path && !old.image_path.split("/").pop()?.startsWith("demo-")) await supabase.storage.from("org-media").remove([old.image_path]);
  await supabase.from("products").delete().eq("id", productId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}`);
}

// ---------------------------------------------------------------- healthy-food menu
const menuSchema = z.object({
  name_ar: z.string().trim().min(2, "اكتب اسم الوجبة").max(120),
  section: opt(40),
  description_ar: opt(500),
  price_jod: z.coerce.number({ message: "اكتب السعر" }).min(0, "السعر غير منطقي").max(10000, "السعر غير منطقي"),
  calories: z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().int("السعرات رقم صحيح").min(0).max(5000, "السعرات غير منطقية").nullable()),
  protein_g: num, carbs_g: num, fat_g: num,
  branch_id: branchField,
});

export async function addMenuItem(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const { image, ...rest } = Object.fromEntries(fd);
  const p = menuSchema.safeParse(rest);
  if (!p.success) return { error: p.error.issues[0].message };
  const { supabase } = await requireUser();
  const { count } = await supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("organization_id", id);
  if ((count ?? 0) >= 300) return { error: "وصلت الحد الأقصى من الوجبات" };
  let image_path: string | null = null;
  if (image instanceof File && image.size > 0) {
    const up = await uploadImage(supabase, id, image);
    if (up.error) return { error: up.error };
    image_path = up.path!;
  }
  const { error } = await supabase.from("menu_items").insert({ ...p.data, organization_id: id, image_path, sort_order: count ?? 0 });
  if (error) {
    if (image_path) await supabase.storage.from("org-media").remove([image_path]);
    return { error: "تعذّرت إضافة الوجبة" };
  }
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تمت إضافة الوجبة" };
}

export async function setMenuImage(id: string, itemId: string, _: FormState, fd: FormData): Promise<FormState> {
  const file = fd.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "اختر صورة" };
  const { supabase } = await requireUser();
  const { data: old } = await supabase.from("menu_items").select("image_path").eq("id", itemId).eq("organization_id", id).maybeSingle();
  if (!old) return { error: "الوجبة غير موجودة" };
  const up = await uploadImage(supabase, id, file);
  if (up.error) return { error: up.error };
  const { error } = await supabase.from("menu_items").update({ image_path: up.path! }).eq("id", itemId).eq("organization_id", id);
  if (error) {
    await supabase.storage.from("org-media").remove([up.path!]);
    return { error: "تعذّر حفظ الصورة" };
  }
  if (old.image_path && !old.image_path.split("/").pop()?.startsWith("demo-")) await supabase.storage.from("org-media").remove([old.image_path]);
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تم تحديث الصورة" };
}

export async function deleteMenuItem(id: string, itemId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { data: old } = await supabase.from("menu_items").select("image_path").eq("id", itemId).eq("organization_id", id).maybeSingle();
  if (old?.image_path && !old.image_path.split("/").pop()?.startsWith("demo-")) await supabase.storage.from("org-media").remove([old.image_path]);
  await supabase.from("menu_items").delete().eq("id", itemId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}`);
}

export async function setMenuAvailability(id: string, itemId: string, available: boolean): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("menu_items").update({ is_available: available }).eq("id", itemId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}`);
}

// ---------------------------------------------------------------- offers
const offerSchema = z.object({
  title_ar: z.string().trim().min(2, "اكتب عنوان العرض").max(120),
  description_ar: opt(500),
  offer_price_jod: num,
  discount_percent: z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().int().min(1, "الخصم من 1 إلى 90").max(90, "الخصم من 1 إلى 90").nullable()),
  kind: z.enum(["offer", "course"]).default("offer"),
  starts_at: z.string().min(1, "اكتب تاريخ البداية"),
  ends_at: z.string().min(1, "اكتب تاريخ النهاية"),
  branch_id: branchField,
});

export async function addOffer(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const p = offerSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const s = new Date(p.data.starts_at), e = new Date(p.data.ends_at);
  e.setHours(23, 59, 59);
  if (e <= s) return { error: "تاريخ النهاية لازم يكون بعد البداية" };
  if (p.data.offer_price_jod == null && p.data.discount_percent == null) return { error: "اكتب سعر العرض أو نسبة الخصم" };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("offers").insert({ ...p.data, starts_at: s.toISOString(), ends_at: e.toISOString(), organization_id: id });
  if (error) return { error: "تعذّرت إضافة العرض" };
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تمت إضافة العرض" };
}

export async function deleteOffer(id: string, offerId: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("offers").delete().eq("id", offerId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}`);
}

// ---------------------------------------------------------------- review responses & inquiries
export async function setInquiryStatus(id: string, inquiryId: string, status: "seen" | "closed"): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("inquiries").update({ status }).eq("id", inquiryId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}/inquiries`);
}

export async function setHeadTrainer(id: string, trainerId: string, on: boolean): Promise<void> {
  const { supabase } = await requireUser();
  if (on) await supabase.from("org_trainers").update({ is_head: false }).eq("organization_id", id);
  await supabase.from("org_trainers").update({ is_head: on }).eq("id", trainerId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}`);
}

// ---------------------------------------------------------------- coach profile + gym links
const coachProfileSchema = z.object({
  role_label: opt(60),
  education: z.string().trim().min(2, "اكتب مؤهلك الدراسي").max(80),
  education_place: opt(80),
  specialties: z.string().trim().min(2, "اكتب مجالات خبرتك").max(200),
  certificates: opt(300),
  session_mode: z.enum(["onsite", "online", "both"]).catch("onsite"),
  experience_years: z.string().min(1, "اكتب سنوات الخبرة").transform(Number).pipe(z.number().int("سنوات الخبرة رقم صحيح").min(0, "سنوات الخبرة من 0 إلى 60").max(60, "سنوات الخبرة من 0 إلى 60")),
});

export async function saveCoachProfile(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const p = coachProfileSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("coach_profiles").upsert({ organization_id: id, ...p.data });
  if (error) return { error: "تعذّر حفظ الملف" };
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تم حفظ ملفك كمدرب" };
}

export async function requestJoinGym(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const q = String(fd.get("gym") ?? "").trim().replace(/[%,()]/g, "");
  if (q.length < 2) return { error: "اكتب اسم النادي" };
  const { supabase } = await requireUser();
  const { data: gyms } = await supabase.from("organizations").select("id,name_ar").eq("type", "gym").eq("status", "published").ilike("name_ar", `%${q}%`).limit(5);
  if (!gyms?.length) return { error: "ما لقينا نادي بهالاسم (لازم يكون منشور)" };
  if (gyms.length > 1) return { error: `في ${gyms.length} نوادي قريبة من هالاسم، اكتب الاسم أدق` };
  const { error } = await supabase.from("coach_gym_links").insert({ gym_org_id: gyms[0].id, coach_org_id: id });
  if (error) {
    if (error.code === "23505") return { error: "طلبت الانضمام لهالنادي من قبل" };
    if (/incomplete/.test(error.message)) return { error: "كمّل ملفك كمدرب (صورة، خبرة، مؤهل، تخصصات) قبل ما تطلب" };
    return { error: "تعذّر إرسال الطلب" };
  }
  revalidatePath(`/dashboard/${id}`);
  return { ok: `انرسل طلبك لـ ${gyms[0].name_ar}، بانتظار موافقتهم` };
}

export async function respondCoachLink(orgId: string, linkId: string, approve: boolean): Promise<void> {
  const { supabase } = await requireUser();
  if (approve) await supabase.from("coach_gym_links").update({ status: "approved" }).eq("id", linkId).eq("gym_org_id", orgId);
  else await supabase.from("coach_gym_links").delete().eq("id", linkId).or(`gym_org_id.eq.${orgId},coach_org_id.eq.${orgId}`);
  revalidatePath(`/dashboard/${orgId}`);
}

// ---------------------------------------------------------------- facility time slots
const hm = (v: string) => { const [h, m] = v.split(":").map(Number); return h * 60 + m; };
const toTime = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export async function addFacilitySlots(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const date = String(fd.get("slot_date") ?? "");
  const from = String(fd.get("from") ?? "");
  const to = String(fd.get("to") ?? "");
  const len = Number(fd.get("length") ?? 60);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(from) || !/^\d{2}:\d{2}$/.test(to)) return { error: "اختر التاريخ والوقت" };
  if (![30, 60, 90, 120].includes(len)) return { error: "مدة الفترة غير صحيحة" };
  const start = hm(from), end = hm(to);
  if (end <= start) return { error: "وقت النهاية لازم يكون بعد البداية" };
  const rows: { organization_id: string; slot_date: string; starts_at: string; ends_at: string }[] = [];
  for (let t = start; t + len <= end && rows.length < 24; t += len) {
    rows.push({ organization_id: id, slot_date: date, starts_at: toTime(t), ends_at: toTime(t + len) });
  }
  if (rows.length === 0) return { error: "المدة بين البداية والنهاية أقصر من طول الفترة" };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("facility_slots").upsert(rows, { onConflict: "organization_id,slot_date,starts_at", ignoreDuplicates: true });
  if (error) return { error: /range/.test(error.message) ? "التاريخ لازم يكون خلال الـ 60 يوم القادمة" : /too many/.test(error.message) ? "وصلت الحد الأقصى من الفترات" : "تعذّرت الإضافة (للملاعب فقط)" };
  revalidatePath(`/dashboard/${id}`);
  return { ok: `تمت إضافة ${rows.length} فترة` };
}

export async function setSlotStatus(id: string, slotId: string, status: "available" | "booked"): Promise<void> {
  if (status !== "available" && status !== "booked") return;
  const { supabase } = await requireUser();
  await supabase.from("facility_slots").update({ status }).eq("id", slotId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}`);
}

export async function deleteSlot(id: string, slotId: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("facility_slots").delete().eq("id", slotId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}`);
}

export async function clearSlotsDay(id: string, date: string): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const { supabase } = await requireUser();
  await supabase.from("facility_slots").delete().eq("organization_id", id).eq("slot_date", date);
  revalidatePath(`/dashboard/${id}`);
}

// ───────── discount codes + equipment market ─────────

const codeSchema = z.object({
  title_ar: z.string().trim().min(2, "اكتب عنوان العرض").max(80),
  code: z.string().trim().min(2, "الكود قصير").max(30).regex(/^[A-Za-z0-9_-]+$/, "الكود أحرف إنجليزية وأرقام فقط"),
  details_ar: opt(200),
  ends_at: z.string().optional().transform((v) => (v ? v : null)),
});

export async function addOfferCode(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const p = codeSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const ends = p.data.ends_at ? new Date(`${p.data.ends_at}T23:59:59+03:00`) : null;
  if (ends && Number.isNaN(ends.getTime())) return { error: "تاريخ غير صحيح" };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("offer_codes").insert({ ...p.data, ends_at: ends ? ends.toISOString() : null, organization_id: id });
  if (error) return { error: error.message.includes("max") || error.message.includes("many") ? "وصلت الحد الأقصى من الأكواد (10)." : "تعذّرت الإضافة" };
  revalidatePath(`/dashboard/${id}/growth`);
  revalidatePath("/deals");
  return { ok: "تمت إضافة الكود" };
}

export async function setOfferCodeActive(id: string, codeId: string, active: boolean): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("offer_codes").update({ is_active: active }).eq("id", codeId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}/growth`);
  revalidatePath("/deals");
}

export async function deleteOfferCode(id: string, codeId: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("offer_codes").delete().eq("id", codeId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}/growth`);
  revalidatePath("/deals");
}

const equipSchema = z.object({
  title_ar: z.string().trim().min(3, "اكتب اسم الجهاز (3 أحرف على الأقل)").max(80),
  description_ar: opt(600),
  condition: z.enum(["new", "like_new", "used"]),
  kind: z.enum(["sale", "swap"]),
  price_jod: z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().min(0).max(1000000).nullable()),
  swap_for: opt(120),
});

export async function addEquipment(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const { image, ...rest } = Object.fromEntries(fd);
  const p = equipSchema.safeParse(rest);
  if (!p.success) return { error: p.error.issues[0].message };
  if (p.data.kind === "sale" && p.data.price_jod == null) return { error: "اكتب السعر للبيع" };
  const { supabase } = await requireUser();
  let image_path: string | null = null;
  if (image instanceof File && image.size > 0) {
    const up = await uploadImage(supabase, id, image);
    if (up.error) return { error: up.error };
    image_path = up.path!;
  }
  const { error } = await supabase.from("equipment_listings").insert({
    ...p.data, price_jod: p.data.kind === "sale" ? p.data.price_jod : null, swap_for: p.data.kind === "swap" ? p.data.swap_for : null,
    organization_id: id, image_path,
  });
  if (error) {
    if (image_path) await supabase.storage.from("org-media").remove([image_path]);
    return { error: error.message.includes("published") ? "النشاط لازم يكون منشور أول." : error.message.includes("many") ? "وصلت الحد الأقصى (20 إعلان فعّال)." : "تعذّرت الإضافة (السوق للنوادي والملاعب والمتاجر)." };
  }
  revalidatePath(`/dashboard/${id}/growth`);
  revalidatePath("/market");
  return { ok: "تم نشر الإعلان لمدة 30 يوم" };
}

export async function setEquipmentStatus(id: string, listingId: string, status: "active" | "sold"): Promise<void> {
  const { supabase } = await requireUser();
  const patch = status === "active"
    ? { status, expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString() }
    : { status };
  await supabase.from("equipment_listings").update(patch).eq("id", listingId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}/growth`);
  revalidatePath("/market");
}

export async function deleteEquipment(id: string, listingId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { data: old } = await supabase.from("equipment_listings").select("image_path,status").eq("id", listingId).eq("organization_id", id).maybeSingle();
  if (!old || old.status === "removed") return;
  await supabase.from("equipment_listings").delete().eq("id", listingId).eq("organization_id", id);
  if (old.image_path) await supabase.storage.from("org-media").remove([old.image_path]);
  revalidatePath(`/dashboard/${id}/growth`);
  revalidatePath("/market");
}

// ───────── videos (reels) ─────────

export async function addVideo(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseVideoUrl(String(fd.get("url") ?? ""));
  if (!parsed) return { error: "الرابط غير مدعوم. استخدم رابط كامل من يوتيوب أو إنستغرام أو تيك توك أو فيسبوك (يبدأ بـ https://)." };
  const title = z.string().trim().max(80).optional().safeParse(fd.get("title") ?? undefined);
  if (!title.success) return { error: "العنوان طويل" };
  const { supabase } = await requireUser();
  let cover_path: string | null = null;
  const cover = fd.get("cover");
  if (cover instanceof File && cover.size > 0) {
    const up = await uploadImage(supabase, id, cover);
    if (up.error) return { error: up.error };
    cover_path = up.path!;
  }
  const { error } = await supabase.from("videos").insert({ organization_id: id, kind: "reel", url: parsed.url, title_ar: title.data || null, cover_path });
  if (error) {
    if (cover_path) await supabase.storage.from("org-media").remove([cover_path]);
    return { error: error.message.includes("too many") ? "وصلت الحد الأقصى (3 فيديوهات)." : "تعذّرت الإضافة" };
  }
  await notifyAdmin(`🎬 فيديو جديد بانتظار الموافقة\n${parsed.url}`);
  revalidatePath(`/dashboard/${id}/growth`);
  return { ok: "وصل الفيديو، بيظهر بعد موافقة الإدارة." };
}

export async function deleteVideo(id: string, videoId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { data: old } = await supabase.from("videos").select("cover_path").eq("id", videoId).eq("organization_id", id).maybeSingle();
  await supabase.from("videos").delete().eq("id", videoId).eq("organization_id", id);
  if (old?.cover_path) await supabase.storage.from("org-media").remove([old.cover_path]);
  revalidatePath(`/dashboard/${id}/growth`);
  revalidatePath("/reels");
}

export async function saveExplanation(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const exerciseId = String(fd.get("exercise_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(exerciseId)) return { error: "اختر التمرين" };
  const raw = String(fd.get("video_url") ?? "").trim();
  let video_url: string | null = null;
  if (raw) {
    const parsed = parseVideoUrl(raw);
    if (!parsed) return { error: "الرابط غير مدعوم. استخدم رابط كامل من يوتيوب أو إنستغرام أو تيك توك أو فيسبوك (يبدأ بـ https://)." };
    video_url = parsed.url;
  }
  const steps = String(fd.get("steps") ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
  if (steps.length < 2 || steps.length > 8) return { error: "اكتب من 2 إلى 8 خطوات، كل خطوة بسطر." };
  if (steps.some((x) => x.length < 2 || x.length > 200)) return { error: "كل خطوة لازم تكون أقل من 200 حرف." };
  const mistake = z.string().trim().max(200).safeParse(String(fd.get("mistake") ?? ""));
  if (!mistake.success) return { error: "الخطأ الشائع طويل (حد أقصى 200 حرف)." };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("exercise_explanations").upsert(
    { exercise_id: exerciseId, organization_id: id, video_url, steps_ar: steps, mistake_ar: mistake.data || null },
    { onConflict: "exercise_id,organization_id" },
  );
  if (error) {
    if (error.message.includes("too many")) return { error: "وصلت الحد الأقصى (20 شرح)." };
    if (error.message.includes("only coaches")) return { error: "الشروحات للمدربين المستقلين فقط." };
    return { error: "تعذّر الحفظ" };
  }
  await notifyAdmin("🏋️ شرح تمرين جديد بانتظار الموافقة");
  revalidatePath(`/dashboard/${id}/exercises`);
  return { ok: "وصل الشرح، بيظهر بعد موافقة الإدارة." };
}

export async function deleteExplanation(id: string, explId: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("exercise_explanations").delete().eq("id", explId).eq("organization_id", id);
  revalidatePath(`/dashboard/${id}/exercises`);
  revalidatePath("/exercises", "layout");
}
