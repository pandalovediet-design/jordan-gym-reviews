"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/app/dashboard/actions";

const schema = z.object({
  title_ar: z.string().trim().min(2, "اكتب عنوان العرض").max(80),
  description_ar: z.string().trim().max(300).optional().transform((v) => v || null),
  discount_percent: z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().int().min(1, "الخصم من 1 إلى 90").max(90, "الخصم من 1 إلى 90").nullable()),
  price_jod: z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().min(0).max(100000).nullable()),
});

export async function saveFlashDeal(orgId: string, slotId: string, _: FormState, fd: FormData): Promise<FormState> {
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  if (p.data.discount_percent == null && p.data.price_jod == null) return { error: "اكتب نسبة الخصم أو سعر العرض" };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("flash_slots").update(p.data).eq("id", slotId).eq("organization_id", orgId);
  if (error) return { error: "تعذّر الحفظ" };
  revalidatePath(`/dashboard/${orgId}/overview`);
  revalidatePath("/");
  return { ok: "تم حفظ عرض الفلاش" };
}
