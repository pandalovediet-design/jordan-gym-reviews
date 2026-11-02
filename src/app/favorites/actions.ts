"use server";
import { listBySlugs } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export async function loadFavorites(slugs: string[]) {
  if (!Array.isArray(slugs)) return [];
  return listBySlugs(slugs.filter((s): s is string => typeof s === "string"));
}

/** Signed-in members can sync their saved gyms across devices. Anonymous visitors keep local favorites. */
export async function getAccountFavoriteSlugs(): Promise<string[] | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const db = supabase as any;
  const { data, error } = await db.from("user_favorites")
    .select("organization_id, organizations!inner(slug)")
    .eq("user_id", auth.user.id);
  if (error) throw new Error("تعذر تحميل المفضلة.");
  return (data ?? []).map((row: any) => row.organizations?.slug).filter((slug: unknown): slug is string => typeof slug === "string");
}

export async function syncAccountFavorites(slugs: string[]): Promise<{ ok: boolean; signedIn: boolean }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, signedIn: false };
  const clean = [...new Set((Array.isArray(slugs) ? slugs : []).filter((s): s is string => typeof s === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)))].slice(0, 100);
  const db = supabase as any;
  const { data: orgs, error: lookupError } = clean.length
    ? await db.from("organizations").select("id,slug").in("slug", clean).eq("status", "published")
    : { data: [], error: null };
  if (lookupError) throw new Error("تعذر مزامنة المفضلة.");
  const { error: deleteError } = await db.from("user_favorites").delete().eq("user_id", auth.user.id);
  if (deleteError) throw new Error("تعذر تحديث المفضلة.");
  if (orgs?.length) {
    const { error } = await db.from("user_favorites").insert(orgs.map((o: any) => ({ user_id: auth.user.id, organization_id: o.id })));
    if (error) throw new Error("تعذر حفظ المفضلة.");
  }
  return { ok: true, signedIn: true };
}
