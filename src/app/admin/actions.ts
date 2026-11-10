"use server";
import { GLOW_COLORS } from "@/lib/format";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { parseVideoUrl } from "@/lib/video";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const ctx = await requireUser();
  const { data } = await ctx.supabase.rpc("is_platform_admin");
  if (!data) throw new Error("forbidden");
  return ctx;
}

/**
 * Attach a listing to a real account after the owner proved it is theirs (checked by hand).
 * fd.email: the account's email. fd.mode: "move" (default; I step out as owner) or "add" (I stay as a co-owner).
 */
export async function assignOrgOwner(orgId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "اكتب إيميل صحيح." };
  const { data: users, error: ue } = await supabase.rpc("admin_list_users");
  if (ue) return { error: "تعذّر قراءة المستخدمين." };
  const target = (users ?? []).find((u) => u.email.toLowerCase() === email);
  if (!target) return { error: "ما في حساب بهالإيميل. اطلب منه يسجّل حساب أول." };
  const { error } = await supabase.from("organization_members").upsert({ organization_id: orgId, user_id: target.id, role: "owner" }, { onConflict: "organization_id,user_id" });
  if (error) return { error: "تعذّر الربط." };
  await supabase.from("organizations").update({ is_claimed: true }).eq("id", orgId);
  let note = "تم الربط، صار مالكاً للنشاط.";
  if (String(fd.get("mode") ?? "move") === "move" && target.id !== user.id) {
    // the guard trigger needs another owner to exist, which is true now that the new owner is in
    const { error: de } = await supabase.from("organization_members").delete().eq("organization_id", orgId).eq("user_id", user.id);
    note = de ? "تم الربط، بس ما قدرت أشيل حسابك من النشاط." : "تم الربط ونُقلت الملكية له.";
  }
  revalidatePath("/admin/orgs");
  revalidatePath("/dashboard", "layout");
  return { ok: note };
}

/**
 * Platform owner creates the account for a club owner: email + a temporary password.
 * The account is flagged so the owner must pick their own password on first sign-in (see requireUser).
 * If the email already has an account, it is just linked (no password is touched).
 */
export async function createOwnerAccount(orgId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "اكتب إيميل صحيح." };
  const { data: users, error: ue } = await supabase.rpc("admin_list_users");
  if (ue) return { error: "تعذّر قراءة المستخدمين." };
  let targetId = (users ?? []).find((u) => u.email.toLowerCase() === email)?.id;
  let note = "الحساب موجود أصلاً، تم ربطه بالنشاط (كلمة مروره ما انلمست).";
  if (!targetId) {
    if (password.length < 8) return { error: "الكلمة المؤقتة 8 أحرف على الأقل (نموذج الدخول بيطلب هيك)." };
    const admin = createAdminClient();
    if (!admin) return { error: "مفتاح الخدمة غير مضبوط على فيرسل." };
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { must_change_password: true } });
    if (error || !data.user) return { error: "تعذّر إنشاء الحساب. تأكد من الإيميل." };
    targetId = data.user.id;
    note = `تم إنشاء الحساب. الإيميل: ${email} · الكلمة المؤقتة: ${password} · لازم يغيّرها أول دخول.`;
  }
  const { error } = await supabase.from("organization_members").upsert({ organization_id: orgId, user_id: targetId, role: "owner" }, { onConflict: "organization_id,user_id" });
  if (error) return { error: "الحساب انعمل بس تعذّر ربطه بالنشاط." };
  await supabase.from("organizations").update({ is_claimed: true }).eq("id", orgId);
  if (String(fd.get("mode") ?? "move") === "move" && targetId !== user.id) {
    await supabase.from("organization_members").delete().eq("organization_id", orgId).eq("user_id", user.id);
  }
  revalidatePath("/admin/orgs");
  revalidatePath("/dashboard", "layout");
  return { ok: note };
}

export async function setOrgStatus(id: string, status: "published" | "suspended" | "draft"): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("organizations").update({ status }).eq("id", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

/** Marks a listing as reviewed/completed by the admin (or puts it back to "not done"). */
export async function setReviewDone(id: string, done: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("organizations").update({ review_done_at: done ? new Date().toISOString() : null }).eq("id", id);
  revalidatePath("/admin", "layout");
}

/** fd.days: "off" removes the badge, "0" = no expiry, otherwise a number of days. */
export async function setVerified(id: string, fd: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const v = String(fd.get("days") ?? "0");
  const days = v === "off" ? null : Math.min(Math.max(Math.floor(Number(v) || 0), 0), 3650);
  const patch = days === null
    ? { verified_at: null, verified_until: null }
    : { verified_at: new Date().toISOString(), verified_until: days > 0 ? new Date(Date.now() + days * 86_400_000).toISOString() : null };
  await supabase.from("organizations").update(patch).eq("id", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

const TYPES = ["gym", "independent_coach", "sports_facility", "store", "nutritionist", "healthy_food", "sports_health"] as const;
/** Moves a business to another type (e.g. a coach who became a center). The category is cleared; the owner picks a new one. */
export async function setOrgType(id: string, fd: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const t = String(fd.get("type") ?? "");
  if (!(TYPES as readonly string[]).includes(t)) return;
  await supabase.from("organizations").update({ type: t as (typeof TYPES)[number], category_id: null }).eq("id", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

/** Moves a place to any category (value "type:slug"), changing type and category together, e.g. gym -> pool -> park. */
export async function setOrgCategory(id: string, fd: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const [t, slug] = String(fd.get("cat") ?? "").split(":");
  if (!t || !slug || !(TYPES as readonly string[]).includes(t)) return;
  const { data: c } = await supabase.from("org_categories").select("id").eq("org_type", t as (typeof TYPES)[number]).eq("slug", slug).maybeSingle();
  if (!c) return;
  await supabase.from("organizations").update({ type: t as (typeof TYPES)[number], category_id: c.id }).eq("id", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

export async function setReportHandled(id: string, handled: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("listing_reports").update({ status: handled ? "handled" : "new" }).eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function moderateProduct(id: string, status: "approved" | "rejected"): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("products").update({ moderation_status: status }).eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function setFeatured(id: string, fd: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const days = Math.max(0, Math.min(366, Number(fd.get("days")) || 0));
  const rank = Math.max(0, Math.min(100, Number(fd.get("rank")) || 0));
  if (days === 0) await supabase.from("org_promotions").update({ featured_until: null, featured_rank: 0 }).eq("organization_id", id);
  else {
    const until = new Date(Date.now() + days * 86_400_000).toISOString();
    await supabase.from("org_promotions").upsert({ organization_id: id, featured_until: until, featured_rank: rank });
  }
  await supabase.from("org_promotions").delete().eq("organization_id", id).is("featured_until", null).is("glow_until", null);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/search");
}

/** Colored glow tier ("عضو ذهبي"...): color + duration in days (0 removes it). */
export async function setGlow(id: string, fd: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const days = Math.max(0, Math.min(1100, Number(fd.get("days")) || 0));
  const color = String(fd.get("color") ?? "");
  if (days === 0 || !(GLOW_COLORS as readonly string[]).includes(color)) {
    await supabase.from("org_promotions").update({ glow_color: null, glow_until: null }).eq("organization_id", id);
  } else {
    const until = new Date(Date.now() + days * 86_400_000).toISOString();
    await supabase.from("org_promotions").upsert({ organization_id: id, glow_color: color, glow_until: until });
  }
  await supabase.from("org_promotions").delete().eq("organization_id", id).is("featured_until", null).is("glow_until", null);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/search");
}

// ---------------------------------------------------------------- ads
import { z } from "zod";
import { baseUrl } from "@/lib/base-url";
import type { FormState } from "@/app/dashboard/actions";

const IMG_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const adSchema = z.object({
  placement: z.enum(["banner", "sponsored"]),
  country_code: z.string().regex(/^[A-Z]{2}$/).default("JO"),
  title: z.string().trim().min(2, "اكتب عنوان الإعلان").max(120),
  subtitle: z.string().trim().max(200).optional().transform((v) => v || null),
  link_url: z.string().trim().max(500).optional().transform((v) => v || null),
  organization_id: z.string().optional().transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null)),
  starts_at: z.string().min(1, "اكتب تاريخ البداية"),
  ends_at: z.string().min(1, "اكتب تاريخ النهاية"),
  advertiser_name: z.string().trim().max(120).optional().transform((v) => v || null),
  advertiser_phone: z.string().trim().max(30).optional().transform((v) => v || null),
  price_jod: z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().min(0).max(1_000_000).nullable()),
  notes: z.string().trim().max(1000).optional().transform((v) => v || null),
});

export async function createAd(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const p = adSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  const start = new Date(d.starts_at), end = new Date(d.ends_at);
  end.setHours(23, 59, 59);
  if (!(end > start)) return { error: "تاريخ النهاية لازم يكون بعد البداية" };
  let link = d.link_url;
  if (!link && d.organization_id) {
    const { data: org } = await supabase.from("organizations").select("slug").eq("id", d.organization_id).maybeSingle();
    if (org) link = `${baseUrl()}/g/${org.slug}`;
  }
  if (!link || !/^https?:\/\//i.test(link)) return { error: "اكتب رابط يبدأ بـ https:// أو اختر نشاط" };
  let image_path: string | null = null;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    const ext = IMG_EXT[file.type];
    if (!ext) return { error: "الصيغ المسموحة: JPG أو PNG أو WebP" };
    if (file.size > 4 * 1024 * 1024) return { error: "حجم الصورة أكبر من 4MB" };
    image_path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("ads").upload(image_path, file, { contentType: file.type, upsert: false });
    if (upErr) return { error: "تعذّر رفع الصورة" };
  }
  const { data: ad, error } = await supabase.from("ads").insert({
    placement: d.placement, country_code: d.country_code, title: d.title, subtitle: d.subtitle, link_url: link, image_path,
    organization_id: d.organization_id, starts_at: start.toISOString(), ends_at: end.toISOString(),
  }).select("id").single();
  if (error || !ad) {
    if (image_path) await supabase.storage.from("ads").remove([image_path]);
    return { error: "تعذّر حفظ الإعلان" };
  }
  await supabase.from("ad_accounting").insert({ ad_id: ad.id, advertiser_name: d.advertiser_name, advertiser_phone: d.advertiser_phone, price_jod: d.price_jod, notes: d.notes });
  revalidatePath("/admin/ads");
  revalidatePath("/");
  return { ok: "تم حفظ الإعلان" };
}

export async function setAdActive(id: string, active: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("ads").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin/ads");
  revalidatePath("/");
}

export async function deleteAd(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("ads").select("image_path").eq("id", id).maybeSingle();
  await supabase.from("ads").delete().eq("id", id);
  if (data?.image_path) await supabase.storage.from("ads").remove([data.image_path]);
  revalidatePath("/admin/ads");
  revalidatePath("/");
}

// ---------------------------------------------------------------- subscriptions
const subSchema = z.object({
  plan_name: z.string().trim().min(2, "اكتب اسم الباقة").max(80),
  amount_jod: z.coerce.number().min(0, "المبلغ غير صحيح").max(1_000_000),
  days: z.coerce.number().int().min(1, "اكتب المدة بالأيام").max(1500),
  notes: z.string().trim().max(500).optional().transform((v) => v || null),
});

export async function addSubscription(orgId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const p = subSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  // A renewal starts when the current period ends (if still running), so no paid days are lost.
  const { data: last } = await supabase.from("org_subscriptions").select("period_end").eq("organization_id", orgId).order("period_end", { ascending: false }).limit(1).maybeSingle();
  const today = new Date().toISOString().slice(0, 10);
  const start = last && last.period_end > today ? last.period_end : today;
  const end = new Date(`${start}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + p.data.days);
  const { error } = await supabase.from("org_subscriptions").insert({
    organization_id: orgId, plan_name: p.data.plan_name, amount_jod: p.data.amount_jod,
    period_start: start, period_end: end.toISOString().slice(0, 10), notes: p.data.notes,
  });
  if (error) return { error: "تعذّر حفظ الاشتراك" };
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin", "layout");
  return { ok: "تم تسجيل الدفعة" };
}

export async function deleteSubscription(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("org_subscriptions").delete().eq("id", id);
  revalidatePath("/admin/subscriptions");
}

// ---------------------------------------------------------------- categories & Pink Zone
const catSchema = z.object({
  org_type: z.enum(["gym", "independent_coach", "sports_facility", "store", "nutritionist", "healthy_food", "sports_health"]),
  name_ar: z.string().trim().min(2, "اكتب اسم التصنيف").max(60),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "الرمز بالإنجليزي صغير وأرقام وشرطات فقط").min(2).max(40),
  sort_order: z.coerce.number().int().min(0).max(10000).default(0),
});

export async function addCategory(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const p = catSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { error } = await supabase.from("org_categories").insert(p.data);
  if (error) return { error: error.code === "23505" ? "هاد الرمز مستخدم." : "تعذّرت الإضافة" };
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: "تمت الإضافة" };
}

export async function updateCategory(id: string, fd: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const name = String(fd.get("name_ar") ?? "").trim();
  const order = Math.max(0, Math.min(10000, Number(fd.get("sort_order")) || 0));
  if (name.length < 2 || name.length > 60) return;
  await supabase.from("org_categories").update({ name_ar: name, sort_order: order }).eq("id", id);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function setCategoryActive(id: string, active: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("org_categories").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategory(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("org_categories").delete().eq("id", id);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function clearWomenAccess(orgId: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("organizations").update({ women_access: "none", women_hours_note: null }).eq("id", orgId);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

const BADGE_PATCH = {
  has_mosque: { has_mosque: false }, no_music: { no_music: false },
  has_kids_area: { has_kids_area: false }, kids_friendly: { kids_friendly: false },
  kids_transport: { kids_transport: false, transport_note: null }, accessibility: { accessibility: [] as string[] },
} as const;
export async function clearOrgBadge(orgId: string, badge: keyof typeof BADGE_PATCH): Promise<void> {
  if (!(badge in BADGE_PATCH)) return;
  const { supabase } = await requireAdmin();
  await supabase.from("organizations").update(BADGE_PATCH[badge]).eq("id", orgId);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

export async function removeEquipment(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("equipment_listings").update({ status: "removed" }).eq("id", id);
  revalidatePath("/admin/market");
  revalidatePath("/market");
}

export async function clearEquipmentReports(listingId: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("equipment_reports").delete().eq("listing_id", listingId);
  revalidatePath("/admin/market");
}

export async function addReviewVideo(_: { error?: string; ok?: string } | undefined, fd: FormData): Promise<{ error?: string; ok?: string }> {
  const { supabase } = await requireAdmin();
  const parsed = parseVideoUrl(String(fd.get("url") ?? ""));
  if (!parsed) return { error: "رابط غير مدعوم (استخدم الرابط الكامل)." };
  const slug = String(fd.get("slug") ?? "").trim();
  const { data: org } = await supabase.from("organizations").select("id").eq("slug", slug).maybeSingle();
  if (!org) return { error: "ما لقيت نشاط بهالـ slug." };
  const title = String(fd.get("title") ?? "").trim().slice(0, 80) || null;
  const { error } = await supabase.from("videos").insert({ organization_id: org.id, kind: "review", url: parsed.url, title_ar: title, status: "approved" });
  if (error) return { error: "تعذّرت الإضافة" };
  revalidatePath("/admin/videos");
  revalidatePath("/reels");
  revalidatePath(`/g/${slug}`);
  return { ok: "تمت إضافة المراجعة" };
}

export async function setVideoStatus(id: string, status: "approved" | "rejected"): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("videos").update({ status }).eq("id", id);
  revalidatePath("/admin/videos");
  revalidatePath("/reels");
}

export async function adminDeleteVideo(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("videos").delete().eq("id", id);
  revalidatePath("/admin/videos");
  revalidatePath("/reels");
}

export async function clearVideoReports(videoId: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("video_reports").delete().eq("video_id", videoId);
  revalidatePath("/admin/videos");
}

export async function setExplanationStatus(id: string, status: "approved" | "rejected"): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("exercise_explanations").update({ status }).eq("id", id);
  revalidatePath("/admin/exercises");
  revalidatePath("/exercises", "layout");
}

export async function adminDeleteExplanation(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("exercise_explanations").delete().eq("id", id);
  revalidatePath("/admin/exercises");
  revalidatePath("/exercises", "layout");
}

export async function setExerciseActive(id: string, active: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("exercises").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin/exercises");
  revalidatePath("/exercises", "layout");
}

export async function addExercise(_prev: { error?: string; ok?: string } | undefined, fd: FormData): Promise<{ error?: string; ok?: string }> {
  const { supabase } = await requireAdmin();
  const slug = String(fd.get("slug") ?? "").trim().toLowerCase();
  const name = String(fd.get("name") ?? "").trim();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 60) return { error: "الـslug إنجليزي صغير وشرطات (مثال: bench-press)" };
  if (name.length < 2 || name.length > 60) return { error: "اكتب اسم التمرين" };
  const { error } = await supabase.from("exercises").insert({
    slug, name_ar: name, muscle_group: String(fd.get("muscle") ?? ""), level: String(fd.get("level") ?? "beginner"),
    gear_ar: String(fd.get("gear") ?? "").trim() || null, secondary_ar: String(fd.get("secondary") ?? "").trim() || null,
    summary_ar: String(fd.get("summary") ?? "").trim().slice(0, 300) || null, sort_order: 200,
  });
  if (error) return { error: error.message.includes("duplicate") ? "الـslug مستعمل" : "تعذّرت الإضافة" };
  revalidatePath("/admin/exercises");
  revalidatePath("/exercises", "layout");
  return { ok: "انضاف التمرين" };
}
