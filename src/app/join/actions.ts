"use server";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { notifyAdmin } from "@/lib/notify";
import type { FormState } from "@/app/dashboard/actions";

// Requests reuse the rate-limited sponsor_leads intake (shown in /admin/leads) with a fixed tag.
const ADD_PLACE_TAG = "طلب إضافة مكان";

const schema = z.object({
  name: z.string().trim().min(2, "اكتب اسمك").max(80),
  place: z.string().trim().min(2, "اكتب اسم المكان").max(80),
  kind: z.string().trim().max(40).optional().transform((v) => v || ""),
  area: z.string().trim().max(80).optional().transform((v) => v || ""),
  phone: z.string().trim().transform((v) => v.replace(/[\s-]/g, "")).pipe(z.string().regex(/^\+?[0-9]{7,15}$/, "رقم الهاتف غير صحيح")),
  maps: z.string().trim().max(300).optional().transform((v) => v || ""),
  note: z.string().trim().max(300).optional().transform((v) => v || ""),
  website: z.string().max(0).optional(), // honeypot
});

export async function requestAddPlace(_: FormState, fd: FormData): Promise<FormState> {
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const done = { ok: "وصلنا طلبك 👌 رح نراجع المكان ونتواصل معك على واتساب قريب." };
  if (p.data.website) return done;
  const message = [
    p.data.kind && `النوع: ${p.data.kind}`,
    p.data.area && `المنطقة: ${p.data.area}`,
    p.data.maps && `الموقع: ${p.data.maps}`,
    p.data.note && `ملاحظة: ${p.data.note}`,
  ].filter(Boolean).join("\n").slice(0, 600);
  const { data, error } = await createPublicClient().rpc("submit_sponsor_lead", {
    p_name: p.data.name, p_company: p.data.place, p_phone: p.data.phone, p_package: ADD_PLACE_TAG, p_message: message,
  });
  if (error || !data) return { error: "تعذّر الإرسال حالياً، جرّب بعد شوي." };
  await notifyAdmin(`🏋️ طلب إضافة مكان\n${p.data.place}${p.data.area ? ` — ${p.data.area}` : ""}\n${p.data.name} · ${p.data.phone}${p.data.kind ? `\nالنوع: ${p.data.kind}` : ""}`);
  return done;
}
