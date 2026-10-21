"use server";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/app/dashboard/actions";

/** Reveals the code (and counts the reveal). The code is never sent to the browser before this call. */
export async function revealCode(id: string, _prev: FormState): Promise<FormState> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "كود غير صالح" };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reveal_offer_code", { p_id: id });
  if (error || !data) return { error: "الكود منتهي أو غير متاح" };
  return { ok: data };
}
