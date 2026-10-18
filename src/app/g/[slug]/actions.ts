"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicState = { error?: string; ok?: string } | undefined;
const back = (slug: string) => `/g/${slug}`;

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "اختر التقييم").max(5),
  body: z.string().trim().max(1500).optional().transform((v) => v || null),
});

export async function submitReview(orgId: string, slug: string, _: PublicState, fd: FormData): Promise<PublicState> {
  const p = reviewSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login`);
  const { error } = await supabase.from("reviews").insert({ organization_id: orgId, user_id: data.user.id, ...p.data });
  if (error) {
    if (error.code === "23505") return { error: "قيّمت هذا النشاط من قبل." };
    return { error: "ما قدرنا نضيف التقييم. ممكن ما يسمح لك تقيّم نشاطك الخاص." };
  }
  revalidatePath(back(slug));
  return { ok: "شكراً! تمت إضافة تقييمك." };
}

export async function reportReview(slug: string, reviewId: string, fd: FormData): Promise<void> {
  const reason = String(fd.get("reason") || "").slice(0, 100);
  if (!reason) return;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  await supabase.from("review_reports").insert({ review_id: reviewId, reporter_id: data.user.id, reason });
  revalidatePath(back(slug));
}

const inquirySchema = z.object({
  sender_name: z.string().trim().min(2, "اكتب اسمك").max(80),
  sender_phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, "رقم الهاتف غير صحيح"),
  message: z.string().trim().min(5, "اكتب رسالتك").max(1000),
  website: z.string().max(0).optional(), // honeypot
});

export async function sendInquiry(orgId: string, slug: string, _: PublicState, fd: FormData): Promise<PublicState> {
  const p = inquirySchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const admin = createAdminClient();
  if (!admin) return { error: "الاستفسارات غير متاحة حالياً، تواصل عبر واتساب." };
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin.from("inquiries").select("id", { count: "exact", head: true })
    .eq("organization_id", orgId).eq("sender_phone", p.data.sender_phone).gte("created_at", since);
  if ((count ?? 0) >= 3) return { error: "أرسلت عدة رسائل مؤخراً، جرّب بعد ساعة." };
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  // Only for organizations that are actually published.
  const { data: org } = await admin.from("organizations").select("id").eq("id", orgId).eq("status", "published").maybeSingle();
  if (!org) return { error: "النشاط غير متاح." };
  const { error } = await admin.from("inquiries").insert({
    organization_id: orgId, sender_name: p.data.sender_name, sender_phone: p.data.sender_phone,
    message: p.data.message, user_id: u.user?.id ?? null, channel: "web",
  });
  if (error) return { error: "تعذّر إرسال الاستفسار." };
  await admin.from("analytics_events").insert({ organization_id: orgId, event_type: "inquiry" });
  return { ok: "وصلت رسالتك، رح يتواصلوا معك قريباً." };
}
