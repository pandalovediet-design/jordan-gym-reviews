"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

async function requireAdmin() {
  const ctx = await requireUser();
  const { data } = await ctx.supabase.rpc("is_platform_admin");
  if (!data) throw new Error("forbidden");
  return ctx;
}

export async function setOrgStatus(id: string, status: "published" | "suspended" | "draft"): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("organizations").update({ status }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function setVerified(id: string, verified: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("organizations").update({ verified_at: verified ? new Date().toISOString() : null }).eq("id", id);
  revalidatePath("/admin");
}

export async function moderateProduct(id: string, status: "approved" | "rejected"): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("products").update({ moderation_status: status }).eq("id", id);
  revalidatePath("/admin");
}

export async function setFeatured(id: string, fd: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const days = Math.max(0, Math.min(366, Number(fd.get("days")) || 0));
  const rank = Math.max(0, Math.min(100, Number(fd.get("rank")) || 0));
  if (days === 0) {
    await supabase.from("org_promotions").delete().eq("organization_id", id);
  } else {
    const until = new Date(Date.now() + days * 86_400_000).toISOString();
    await supabase.from("org_promotions").upsert({ organization_id: id, featured_until: until, featured_rank: rank });
  }
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/search");
}
