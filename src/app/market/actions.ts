"use server";
import { createPublicClient } from "@/lib/supabase/public";
import { notifyAdmin } from "@/lib/notify";
import type { FormState } from "@/app/dashboard/actions";

export async function reportListing(id: string, _: FormState, fd: FormData): Promise<FormState> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "إعلان غير صالح" };
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 200);
  const { data, error } = await createPublicClient().rpc("report_equipment", { p_id: id, p_reason: reason });
  if (error || !data) return { error: "تعذّر إرسال البلاغ" };
  await notifyAdmin(`🚩 بلاغ على إعلان بسوق المعدات\n${reason || "بدون سبب"}`);
  return { ok: "وصلنا البلاغ، شكراً." };
}
