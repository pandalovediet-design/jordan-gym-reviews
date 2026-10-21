"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ammanMonthStart } from "@/lib/format";

export async function castVote(category: "gym" | "coach", orgId: string): Promise<void> {
  if (category !== "gym" && category !== "coach") return;
  if (!/^[0-9a-f-]{36}$/i.test(orgId)) return;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/awards");
  // re-voting replaces the previous vote (RLS limits deletes to the caller's own rows)
  await supabase.from("monthly_votes").delete().eq("category", category).eq("voter_id", data.user.id).eq("vote_month", ammanMonthStart(0));
  const { error } = await supabase.from("monthly_votes").insert({ category, nominee_org_id: orgId });
  revalidatePath("/awards");
  if (error) {
    const why = /too new/.test(error.message) ? "new" : /own organization/.test(error.message) ? "own" : "fail";
    redirect(`/awards?err=${why}`);
  }
  redirect("/awards?ok=1");
}
