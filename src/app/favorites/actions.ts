"use server";
import { listBySlugs } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const cleanSlugs = (slugs: unknown): string[] =>
  [...new Set((Array.isArray(slugs) ? slugs : []).filter((s): s is string => typeof s === "string" && SLUG.test(s)))].slice(0, 100);

export async function loadFavorites(slugs: string[]) {
  if (!Array.isArray(slugs)) return [];
  return listBySlugs(slugs.filter((s): s is string => typeof s === "string"));
}

/** Signed-in members keep their saved places in their account. Visitors keep local favorites only. */
export async function getAccountFavorites(): Promise<{ userId: string; slugs: string[] } | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from("user_favorites")
    .select("created_at, organizations!inner(slug)")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error("تعذر تحميل المفضلة.");
  const slugs = (data ?? []).map((row) => row.organizations?.slug).filter((slug): slug is string => typeof slug === "string");
  return { userId: auth.user.id, slugs };
}

async function publishedIds(slugs: string[]) {
  if (!slugs.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("organizations").select("id").in("slug", slugs).eq("status", "published");
  if (error) throw new Error("تعذر مزامنة المفضلة.");
  return (data ?? []).map((o) => o.id);
}

/** Adds or removes one place. Only the touched row changes, so other devices' favorites are never wiped. */
export async function setAccountFavorite(slug: string, saved: boolean): Promise<{ signedIn: boolean }> {
  const [clean] = cleanSlugs([slug]);
  if (!clean) throw new Error("النشاط غير صحيح.");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { signedIn: false };
  const [orgId] = await publishedIds([clean]);
  if (!orgId) return { signedIn: true };
  const { error } = saved
    ? await supabase.from("user_favorites").upsert(
        { user_id: auth.user.id, organization_id: orgId },
        { onConflict: "user_id,organization_id", ignoreDuplicates: true },
      )
    : await supabase.from("user_favorites").delete().eq("user_id", auth.user.id).eq("organization_id", orgId);
  if (error) throw new Error("تعذر تحديث المفضلة.");
  return { signedIn: true };
}

/** One-time upload of favorites saved on this device before signing in. Adds only; never deletes. */
export async function mergeAccountFavorites(slugs: string[]): Promise<{ signedIn: boolean }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { signedIn: false };
  const ids = await publishedIds(cleanSlugs(slugs));
  if (!ids.length) return { signedIn: true };
  const { error } = await supabase.from("user_favorites").upsert(
    ids.map((organization_id) => ({ user_id: auth.user.id, organization_id })),
    { onConflict: "user_id,organization_id", ignoreDuplicates: true },
  );
  if (error) throw new Error("تعذر حفظ المفضلة.");
  return { signedIn: true };
}
