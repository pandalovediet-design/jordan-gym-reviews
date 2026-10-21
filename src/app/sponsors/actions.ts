"use server";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { notifyAdmin } from "@/lib/notify";
import type { FormState } from "@/app/dashboard/actions";

const schema = z.object({
  name: z.string().trim().min(2, "اكتب اسمك").max(80),
  company: z.string().trim().max(80).optional().transform((v) => v || null),
  phone: z.string().trim().transform((v) => v.replace(/[\s-]/g, "")).pipe(z.string().regex(/^\+?[0-9]{7,15}$/, "رقم الهاتف غير صحيح")),
  package: z.string().trim().max(60).optional().transform((v) => v || null),
  message: z.string().trim().max(600).optional().transform((v) => v || null),
  website: z.string().max(0).optional(), // honeypot
});

export async function submitSponsorLead(_: FormState, fd: FormData): Promise<FormState> {
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  if (p.data.website) return { ok: "وصلنا طلبك، رح نتواصل معك قريب." };
  const { data, error } = await createPublicClient().rpc("submit_sponsor_lead", {
    p_name: p.data.name, p_company: p.data.company ?? "", p_phone: p.data.phone, p_package: p.data.package ?? "", p_message: p.data.message ?? "",
  });
  if (error || !data) return { error: "تعذّر الإرسال حالياً، جرّب بعد شوي." };
  await notifyAdmin(`🤝 طلب رعاية جديد\n${p.data.name}${p.data.company ? ` — ${p.data.company}` : ""}\n${p.data.phone}\nالباقة: ${p.data.package ?? "-"}`);
  return { ok: "وصلنا طلبك، رح نتواصل معك قريب." };
}
