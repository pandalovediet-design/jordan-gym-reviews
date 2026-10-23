"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/notify";

export type ReviewState = { error?: string; ok?: string } | undefined;

// Anti-fake rules (all enforced here, on top of the DB rules: one review per account per place, members can't review their own place):
const MIN_ACCOUNT_AGE_MS = 24 * 3_600_000; // brand-new accounts can't review yet
const MAX_NEW_PER_DAY = 3; // new reviews per account per 24h
const LINK_OR_PHONE = /(https?:\/\/|www\.|\.(com|net|org|io|me|co)\b|wa\.me|t\.me|@\w{3,}|\+?\d[\d\s-]{7,}\d)/i; // ads and contact info don't belong in a review

const reviewSchema = z.object({
  rating: z.coerce.number("اختر عدد النجوم").int().min(1, "اختر عدد النجوم").max(5, "اختر عدد النجوم"),
  body: z.string().trim().max(1000, "التقييم طويل (الحد 1000 حرف)").optional().transform((v) => v || null),
  website: z.string().max(0).optional(), // honeypot
});

export async function saveReview(orgId: string, slug: string, _: ReviewState, fd: FormData): Promise<ReviewState> {
  const p = reviewSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { rating, body } = p.data;
  if (body && body.length < 10) return { error: "اكتب 10 أحرف على الأقل، أو اترك الخانة فاضية وقيّم بالنجوم بس." };
  if (body && LINK_OR_PHONE.test(body)) return { error: "ما بنقبل روابط أو أرقام هاتف داخل التقييم." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { error: "سجّل دخول أول عشان تقيّم." };
  if (!user.email_confirmed_at) return { error: "أكّد إيميلك أول، وبعدين بتقدر تقيّم." };
  if (Date.now() - Date.parse(user.created_at) < MIN_ACCOUNT_AGE_MS) return { error: "حسابك جديد. بتقدر تقيّم بعد 24 ساعة من إنشائه (حماية من التقييمات المزيفة)." };

  const { data: mine } = await supabase.from("reviews").select("id").eq("organization_id", orgId).eq("user_id", user.id).maybeSingle();
  if (mine) {
    const { error } = await supabase.from("reviews").update({ rating, body, updated_at: new Date().toISOString() }).eq("id", mine.id);
    if (error) return { error: "تعذّر حفظ تقييمك." };
  } else {
    const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
    const { count } = await supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
    if ((count ?? 0) >= MAX_NEW_PER_DAY) return { error: "قيّمت عدة أماكن اليوم، جرّب بكرة." };
    const { error } = await supabase.from("reviews").insert({ organization_id: orgId, user_id: user.id, rating, body });
    if (error) {
      if (error.code === "42501" || /own organization/i.test(error.message)) return { error: "ما بتقدر تقيّم نشاطك." };
      return { error: "تعذّر حفظ تقييمك." };
    }
  }
  revalidatePath(`/g/${slug}`);
  return { ok: mine ? "تم تحديث تقييمك." : "شكراً، وصل تقييمك." };
}

const reportSchema = z.object({
  reason: z.enum(["spam", "abuse", "fake", "other"], "اختر سبب البلاغ"),
  details: z.string().trim().max(500).optional().transform((v) => v || null),
});

export async function reportReview(reviewId: string, slug: string, _: ReviewState, fd: FormData): Promise<ReviewState> {
  const p = reportSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "سجّل دخول أول عشان تبلّغ." };
  const { error } = await supabase.from("review_reports").insert({ review_id: reviewId, reporter_id: auth.user.id, reason: p.data.reason, details: p.data.details });
  if (error) return { error: error.code === "23505" ? "بلّغت عن هالتقييم من قبل." : "تعذّر إرسال البلاغ." };
  await notifyAdmin(`🚩 بلاغ على تقييم بصفحة /g/${slug}\nالسبب: ${p.data.reason}${p.data.details ? `\n${p.data.details}` : ""}`);
  return { ok: "وصلنا بلاغك، شكراً." };
}
