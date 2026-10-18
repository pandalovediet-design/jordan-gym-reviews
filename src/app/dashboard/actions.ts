"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;
const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
const num = z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().nullable());

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);

const createSchema = z.object({
  name_ar: z.string().trim().min(2, "اكتب اسم النشاط").max(80),
  type: z.enum(["gym", "independent_coach", "sports_facility", "store"]),
  city: z.string().trim().min(2, "اكتب المدينة").max(40),
});

export async function createOrg(_: FormState, fd: FormData): Promise<FormState> {
  const p = createSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { supabase, user } = await requireUser();
  const base = slugify(p.data.name_ar) || (p.data.type === "store" ? "store" : p.data.type === "independent_coach" ? "coach" : "gym");
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await supabase
    .from("organizations")
    .insert({ ...p.data, slug, created_by: user.id })
    .select("id").single();
  if (error) return { error: error.message.includes("max") || error.message.includes("limit") ? "وصلت الحد الأقصى من الأنشطة." : "تعذّر إنشاء النشاط." };
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
  latitude: num,
  longitude: num,
});

export async function updateProfile(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const p = profileSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "تأكد من البيانات المدخلة" };
  const { supabase } = await requireUser();
  const data = { ...p.data, phone: intl(p.data.phone), whatsapp: intl(p.data.whatsapp), instagram: p.data.instagram?.replace(/^@/, "") ?? null };
  const lat = data.latitude, lng = data.longitude;
  if ((lat == null) !== (lng == null)) return { error: "اكتب خط العرض والطول معاً أو اتركهم فاضيين" };
  const { error } = await supabase.from("organizations").update(data).eq("id", id);
  if (error) return { error: "تعذّر الحفظ. تأكد من صيغة الهاتف والواتساب والموقع (يبدأ بـ https://)." };
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تم الحفظ" };
}

export async function submitForReview(id: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("organizations").update({ status: "pending" }).eq("id", id).eq("status", "draft");
  revalidatePath(`/dashboard/${id}`);
}

const serviceSchema = z.object({
  name_ar: z.string().trim().min(2, "اكتب اسم الخدمة").max(80),
  price_jod: num,
  billing_period: z.enum(["session", "day", "week", "month", "quarter", "year", ""]).transform((v) => v || null),
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

export async function saveHours(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const rows = [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const closed = fd.get(`closed_${d}`) === "on";
    const o = String(fd.get(`open_${d}`) || ""), c = String(fd.get(`close_${d}`) || "");
    return { organization_id: id, weekday: d, is_closed: closed || !o || !c, opens_at: closed || !o ? null : o, closes_at: closed || !c ? null : c };
  });
  const { error } = await supabase.from("organization_hours").upsert(rows, { onConflict: "organization_id,weekday" });
  if (error) return { error: "تعذّر حفظ الدوام" };
  revalidatePath(`/dashboard/${id}`);
  return { ok: "تم حفظ الدوام" };
}
