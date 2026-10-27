"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/app/dashboard/actions";
import { HOME_BLOCKS, NAV_CATALOG, SETTINGS_TAG, normalizeSettings } from "@/lib/site-settings";

export async function saveSiteSettings(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) return { error: "هاد الخيار لصاحب المنصة بس." };

  // Header tabs: the ticked ones, sorted by the order number next to each.
  const nav = NAV_CATALOG
    .map((n, i) => ({ href: n.href, on: fd.get(`nav_on:${n.href}`) === "on", order: Number(fd.get(`nav_order:${n.href}`)) || i + 1, i }))
    .filter((n) => n.on)
    .sort((a, b) => a.order - b.order || a.i - b.i)
    .map((n) => n.href);
  const home = Object.fromEntries(HOME_BLOCKS.map((b) => [b.key, fd.get(`home:${b.key}`) === "on"]));
  const settings = normalizeSettings({
    nav,
    home,
    perSection: fd.get("perSection"),
    maxSections: fd.get("maxSections"),
    heroTitle: String(fd.get("heroTitle") ?? ""),
    heroAccent: String(fd.get("heroAccent") ?? ""),
    heroSubtitle: String(fd.get("heroSubtitle") ?? ""),
  });

  const { error } = await supabase.from("site_settings").upsert({ id: 1, data: settings, updated_at: new Date().toISOString() });
  if (error) return { error: "ما انحفظت الإعدادات. تأكد إن جدول الإعدادات انضاف لقاعدة البيانات." };
  revalidateTag(SETTINGS_TAG, "max");
  revalidatePath("/", "layout");
  return { ok: "انحفظت. التغيير بيظهر على الموقع خلال ثواني." };
}
