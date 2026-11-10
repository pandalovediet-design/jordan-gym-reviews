"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

/** Country managers act with their own session: the database only lets them touch their own market. */
export async function managerSetStatus(id: string, status: "published" | "suspended" | "draft"): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const { supabase } = await requireUser();
  const { data: org } = await supabase.from("organizations").select("country_code").eq("id", id).maybeSingle();
  if (!org) return;
  const { data: allowed } = await supabase.rpc("is_country_manager", { p_country: org.country_code });
  if (!allowed) return;
  await supabase.from("organizations").update({ status }).eq("id", id);
  revalidatePath("/manager");
  revalidatePath("/");
}
