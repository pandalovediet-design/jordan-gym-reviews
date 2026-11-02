"use server";

import { createClient } from "@/lib/supabase/server";

export type CloudWorkout = { workout_date: string; activity: string; minutes: number };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
function validWorkout(entry: CloudWorkout): CloudWorkout {
  if (!entry || typeof entry !== "object" || !DATE.test(String(entry.workout_date)) ||
      typeof entry.activity !== "string" || entry.activity.trim().length > 80 ||
      !Number.isInteger(entry.minutes) || entry.minutes < 0 || entry.minutes > 1440) {
    throw new Error("بيانات التمرين غير صحيحة.");
  }
  return { workout_date: entry.workout_date, activity: entry.activity.trim() || "تمرين", minutes: entry.minutes };
}

export async function getAccountWorkoutLogs(): Promise<{ userId: string; items: CloudWorkout[] } | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from("user_workout_logs")
    .select("workout_date,activity,minutes")
    .eq("user_id", auth.user.id)
    .order("workout_date", { ascending: true })
    .limit(1500);
  if (error) throw new Error("تعذر تحميل سجل التمارين.");
  return { userId: auth.user.id, items: data ?? [] };
}

/** Saves one or more days (upsert). Used for a single day and for the one-time merge or a restored backup. */
export async function saveAccountWorkoutLogs(entries: CloudWorkout[]): Promise<{ ok: boolean; signedIn: boolean }> {
  if (!Array.isArray(entries) || entries.length > 1500) throw new Error("بيانات التمرين غير صحيحة.");
  const clean = entries.map(validWorkout);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, signedIn: false };
  if (!clean.length) return { ok: true, signedIn: true };
  const { error } = await supabase.from("user_workout_logs").upsert(
    clean.map((e) => ({ ...e, user_id: auth.user.id })),
    { onConflict: "user_id,workout_date" },
  );
  if (error) throw new Error("تعذر حفظ التمرين.");
  return { ok: true, signedIn: true };
}

export async function deleteAccountWorkoutLog(date: string): Promise<{ signedIn: boolean }> {
  if (!DATE.test(date)) throw new Error("التاريخ غير صحيح.");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { signedIn: false };
  const { error } = await supabase.from("user_workout_logs").delete()
    .eq("user_id", auth.user.id).eq("workout_date", date);
  if (error) throw new Error("تعذر حذف التمرين.");
  return { signedIn: true };
}
