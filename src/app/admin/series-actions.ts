"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/app/dashboard/actions";

async function requireAdmin() {
  const ctx = await requireUser();
  const { data } = await ctx.supabase.rpc("is_platform_admin");
  if (!data) throw new Error("forbidden");
  return ctx;
}
const refresh = () => { revalidatePath("/admin/series"); revalidatePath("/no-gym"); revalidatePath("/no-deprivation"); };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const UUID = /^[0-9a-f-]{36}$/i;

export async function addSeries(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const kind = str(fd, "kind");
  if (kind !== "home" && kind !== "nutrition") return { error: "اختار النوع" };
  const title = str(fd, "title");
  if (title.length < 2 || title.length > 80) return { error: "اكتب اسم السلسلة (2-80 حرف)" };
  const ids = fd.getAll(kind === "home" ? "home_items" : "nutrition_items").map(String).filter((x) => UUID.test(x));
  if (ids.length < 1 || ids.length > 12) return { error: "اختار من عنصر لـ12 عنصر من قائمة النوع المختار" };
  let slug = str(fd, "slug").toLowerCase();
  if (!slug) slug = `series-${crypto.randomUUID().slice(0, 8)}`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 60) return { error: "الـslug إنجليزي صغير وشرطات" };
  const { error } = await supabase.from("named_series").insert({ slug, kind, title_ar: title, description_ar: str(fd, "description").slice(0, 300) || null, item_ids: ids, sort_order: 100 });
  if (error) return { error: error.message.includes("duplicate") ? "الـslug مستعمل" : "تعذّرت الإضافة" };
  refresh();
  return { ok: "انضافت السلسلة" };
}

export async function setSeriesActive(id: string, active: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("named_series").update({ is_active: active }).eq("id", id);
  refresh();
}

export async function deleteSeries(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.from("named_series").delete().eq("id", id);
  refresh();
}
