"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmin } from "@/lib/notify";
import { REPORT_REASON } from "@/lib/format";

export type PublicState = { error?: string; ok?: string } | undefined;

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
    message: p.data.message, user_id: u.user?.id ?? null, channel: "form",
  });
  if (error) return { error: "تعذّر إرسال الاستفسار." };
  await admin.from("analytics_events").insert({ organization_id: orgId, event_type: "inquiry" });
  return { ok: "وصلت رسالتك، رح يتواصلوا معك قريباً." };
}

const reportSchema = z.object({
  reason: z.enum(["wrong_info", "fake", "inappropriate", "closed", "other"], "اختر سبب البلاغ"),
  details: z.string().trim().max(500).optional().transform((v) => v || null),
  contact: z.string().trim().max(100).optional().transform((v) => v || null),
  website: z.string().max(0).optional(), // honeypot
});

export async function sendReport(orgId: string, slug: string, _: PublicState, fd: FormData): Promise<PublicState> {
  const p = reportSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("listing_reports").insert({ reason: p.data.reason, details: p.data.details, contact: p.data.contact, organization_id: orgId });
  if (error) return { error: error.message.includes("too many") ? "وصلنا عدة بلاغات عن هالصفحة، شكراً لصبرك." : "تعذّر إرسال البلاغ." };
  await notifyAdmin(`🚩 بلاغ جديد على /g/${slug}\nالسبب: ${REPORT_REASON[p.data.reason]}${p.data.details ? `\n${p.data.details}` : ""}`);
  return { ok: "وصلنا بلاغك، شكراً. رح نراجع الصفحة." };
}
