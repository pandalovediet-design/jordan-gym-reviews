"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

async function requireAdmin() {
  const ctx = await requireUser();
  const { data } = await ctx.supabase.rpc("is_platform_admin");
  if (!data) throw new Error("forbidden");
  return ctx;
}

export async function setOrgStatus(id: string, status: "published" | "suspended" | "draft"): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("organizations").update({ status }).eq("id", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

export async function setVerified(id: string, verified: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("organizations").update({ verified_at: verified ? new Date().toISOString() : null }).eq("id", id);
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
  if (days === 0) {
    await supabase.from("org_promotions").delete().eq("organization_id", id);
  } else {
    const until = new Date(Date.now() + days * 86_400_000).toISOString();
    await supabase.from("org_promotions").upsert({ organization_id: id, featured_until: until, featured_rank: rank });
  }
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
    placement: d.placement, title: d.title, subtitle: d.subtitle, link_url: link, image_path,
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
