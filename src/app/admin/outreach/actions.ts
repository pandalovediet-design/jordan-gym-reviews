"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

async function requireAdmin() {
  const ctx = await requireUser();
  const { data } = await ctx.supabase.rpc("is_platform_admin");
  if (!data) throw new Error("forbidden");
  return ctx;
}

/** Mark (or unmark) that I messaged this place. */
export async function setOutreach(orgId: string, on: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("organizations").update({ outreach_at: on ? new Date().toISOString() : null }).eq("id", orgId);
  revalidatePath("/admin/outreach");
}

/** Approve: the requester becomes the owner, I step out, the page stops showing the "unclaimed" banner. */
export async function approveClaim(requestId: string): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const { data: req } = await supabase.from("claim_requests").select("id,organization_id,user_id,status").eq("id", requestId).maybeSingle();
  if (!req || req.status !== "pending") return;
  const { error } = await supabase.from("organization_members").upsert({ organization_id: req.organization_id, user_id: req.user_id, role: "owner" }, { onConflict: "organization_id,user_id" });
  if (error) throw new Error("تعذّر ربط صاحب النادي.");
  if (req.user_id !== user.id) {
    await supabase.from("organization_members").delete().eq("organization_id", req.organization_id).eq("user_id", user.id);
  }
  const now = new Date().toISOString();
  await supabase.from("organizations").update({ is_claimed: true }).eq("id", req.organization_id);
  await supabase.from("claim_requests").update({ status: "approved", decided_at: now }).eq("id", req.id);
  // Anyone else waiting on the same place is turned down.
  await supabase.from("claim_requests").update({ status: "rejected", decided_at: now }).eq("organization_id", req.organization_id).eq("status", "pending");
  revalidatePath("/admin/outreach");
  revalidatePath("/admin/orgs");
  revalidatePath("/dashboard", "layout");
}

export async function rejectClaim(requestId: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("claim_requests").update({ status: "rejected", decided_at: new Date().toISOString() }).eq("id", requestId).eq("status", "pending");
  revalidatePath("/admin/outreach");
}
