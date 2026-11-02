"use server";

import { createClient } from "@/lib/supabase/server";

export type CloudWorkout = { workout_date: string; activity: string; minutes: number };

export async function getAccountWorkoutLogs(): Promise<CloudWorkout[] | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const db = supabase as any;
  const { data, error } = await db.from("user_workout_logs")
    .select("workout_date,activity,minutes")
    .eq("user_id", auth.user.id)
    .order("workout_date", { ascending: true })
    .limit(1500);
  if (error) throw new Error("تعذر تحميل سجل التمارين.");
  return (data ?? []) as CloudWorkout[];
}

export async function saveAccountWorkoutLog(entry: CloudWorkout): Promise<{ ok: boolean; signedIn: boolean }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, signedIn: false };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.workout_date) ||
      typeof entry.activity !== "string" || entry.activity.trim().length < 1 || entry.activity.length > 80 ||
      !Number.isInteger(entry.minutes) || entry.minutes < 0 || entry.minutes > 1440) {
    throw new Error("بيانات التمرين غير صحيحة.");
  }
  const db = supabase as any;
  const { error } = await db.from("user_workout_logs").upsert({
    user_id: auth.user.id,
    workout_date: entry.workout_date,
    activity: entry.activity.trim(),
    minutes: entry.minutes,
  }, { onConflict: "user_id,workout_date" });
  if (error) throw new Error("تعذر حفظ التمرين.");
  return { ok: true, signedIn: true };
}

export async function deleteAccountWorkoutLog(date: string): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("التاريخ غير صحيح.");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const db = supabase as any;
  const { error } = await db.from("user_workout_logs").delete()
    .eq("user_id", auth.user.id).eq("workout_date", date);
  if (error) throw new Error("تعذر حذف التمرين.");
}
