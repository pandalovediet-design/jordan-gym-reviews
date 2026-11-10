"use server";

import { createClient } from "@/lib/supabase/server";
import { NOTE_MAX, WATER_MAX, isMeal, isRating, type MealId, type RatingId } from "@/lib/food-log";

export type CloudMeal = { log_date: string; meal: MealId; note: string; rating: RatingId };
export type CloudWater = { log_date: string; cups: number };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function validMeal(m: CloudMeal): CloudMeal {
  if (!m || typeof m !== "object" || !DATE.test(String(m.log_date)) || !isMeal(m.meal) || !isRating(m.rating) ||
      typeof m.note !== "string" || m.note.trim().length > NOTE_MAX) {
    throw new Error("بيانات الوجبة غير صحيحة.");
  }
  return { log_date: m.log_date, meal: m.meal, rating: m.rating, note: m.note.trim() };
}

export async function getAccountFood(since: string): Promise<{ userId: string; meals: CloudMeal[]; water: CloudWater[] } | null> {
  if (!DATE.test(since)) throw new Error("التاريخ غير صحيح.");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const [meals, water] = await Promise.all([
    supabase.from("user_food_logs").select("log_date,meal,note,rating").eq("user_id", auth.user.id).gte("log_date", since).limit(3000),
    supabase.from("user_water_logs").select("log_date,cups").eq("user_id", auth.user.id).gte("log_date", since).limit(800),
  ]);
  if (meals.error || water.error) throw new Error("تعذر تحميل سجل الأكل.");
  return {
    userId: auth.user.id,
    meals: (meals.data ?? []).flatMap((r) => isMeal(r.meal) && isRating(r.rating) ? [{ log_date: r.log_date, meal: r.meal, note: r.note, rating: r.rating }] : []),
    water: water.data ?? [],
  };
}

/** Upserts meals (one or many: a single tap, the first-sign-in merge, or a restore). */
export async function saveAccountMeals(meals: CloudMeal[]): Promise<{ signedIn: boolean }> {
  if (!Array.isArray(meals) || meals.length > 3000) throw new Error("بيانات الوجبة غير صحيحة.");
  const clean = meals.map(validMeal);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { signedIn: false };
  if (!clean.length) return { signedIn: true };
  const { error } = await supabase.from("user_food_logs").upsert(
    clean.map((m) => ({ ...m, user_id: auth.user.id })),
    { onConflict: "user_id,log_date,meal" },
  );
  if (error) throw new Error("تعذر حفظ الوجبة.");
  return { signedIn: true };
}

export async function deleteAccountMeal(logDate: string, meal: MealId): Promise<{ signedIn: boolean }> {
  if (!DATE.test(logDate) || !isMeal(meal)) throw new Error("بيانات الوجبة غير صحيحة.");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { signedIn: false };
  const { error } = await supabase.from("user_food_logs").delete()
    .eq("user_id", auth.user.id).eq("log_date", logDate).eq("meal", meal);
  if (error) throw new Error("تعذر حذف الوجبة.");
  return { signedIn: true };
}

export async function saveAccountWater(entries: CloudWater[]): Promise<{ signedIn: boolean }> {
  if (!Array.isArray(entries) || entries.length > 800 ||
      entries.some((e) => !DATE.test(String(e?.log_date)) || !Number.isInteger(e.cups) || e.cups < 0 || e.cups > WATER_MAX)) {
    throw new Error("بيانات الماء غير صحيحة.");
  }
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { signedIn: false };
  if (!entries.length) return { signedIn: true };
  const { error } = await supabase.from("user_water_logs").upsert(
    entries.map((e) => ({ log_date: e.log_date, cups: e.cups, user_id: auth.user.id })),
    { onConflict: "user_id,log_date" },
  );
  if (error) throw new Error("تعذر حفظ الماء.");
  return { signedIn: true };
}
