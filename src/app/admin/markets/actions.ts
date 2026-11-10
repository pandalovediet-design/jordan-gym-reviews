"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/app/dashboard/actions";

async function requireAdmin() {
  const ctx = await requireUser();
  const { data } = await ctx.supabase.rpc("is_platform_admin");
  if (!data) throw new Error("forbidden");
  return ctx;
}
const done = () => revalidatePath("/admin/markets");
const code = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "رمز الدولة حرفين إنجليزي، مثل AE");

const countrySchema = z.object({
  code,
  name_ar: z.string().trim().min(2, "اكتب اسم الدولة بالعربي").max(60),
  name_en: z.string().trim().min(2, "اكتب اسم الدولة بالإنجليزي").max(60),
});

export async function addCountry(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const p = countrySchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { error } = await supabase.from("countries").insert({ ...p.data, market_name: `GYM${p.data.code}`, is_active: false });
  if (error) return { error: error.code === "23505" ? "هاي الدولة مضافة من قبل." : "تعذّرت الإضافة" };
  done();
  return { ok: "انضافت الدولة (مطفية لحد ما تفعّلها)" };
}

export async function setCountryActive(countryCode: string, active: boolean): Promise<void> {
  const { supabase } = await requireAdmin();
  // Jordan is the home market and stays on.
  if (countryCode === "JO" && !active) return;
  await supabase.from("countries").update({ is_active: active }).eq("code", countryCode);
  done();
}

const citySchema = z.object({
  country_code: code,
  name_ar: z.string().trim().min(2, "اكتب اسم المدينة بالعربي").max(60),
  name_en: z.string().trim().max(60).optional().transform((v) => v || null),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "الرمز بالإنجليزي بدون فراغات، مثل riyadh").min(2).max(40),
});

export async function addCity(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const p = citySchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { error } = await supabase.from("cities").insert(p.data);
  if (error) return { error: error.code === "23505" ? "هاي المدينة أو رمزها موجود بنفس الدولة." : "تعذّرت الإضافة" };
  done();
  return { ok: "انضافت المدينة" };
}

export async function deleteCity(id: string): Promise<void> {
  const { supabase } = await requireAdmin();
  // Only empty cities can be removed, so no listing loses its city.
  const { count } = await supabase.from("organizations").select("id", { count: "exact", head: true }).eq("city_id", id);
  if (count) return;
  await supabase.from("cities").delete().eq("id", id);
  done();
}

const managerSchema = z.object({ email: z.string().trim().email("اكتب إيميل صحيح"), country_code: code });

export async function addCountryManager(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const p = managerSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { data, error } = await supabase.rpc("set_country_manager", { p_email: p.data.email, p_country: p.data.country_code, p_on: true });
  if (error) return { error: "تعذّر التعيين" };
  if (data === "no_user") return { error: "ما في حساب بهالإيميل. خلّيه ينشئ حساب بالموقع أول." };
  done();
  return { ok: "تم تعيينه مدير دولة" };
}

export async function removeCountryManager(email: string, countryCode: string): Promise<void> {
  const { supabase } = await requireAdmin();
  await supabase.rpc("set_country_manager", { p_email: email, p_country: countryCode, p_on: false });
  done();
}
