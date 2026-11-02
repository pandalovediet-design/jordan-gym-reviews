"use server";

import { createClient } from "@/lib/supabase/server";

export type ChallengeProgress = { challenge_id: "sessions" | "walks" | "water"; progress: number };

export async function getAccountChallengeProgress(weekStart: string): Promise<ChallengeProgress[] | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) throw new Error("الأسبوع غير صحيح.");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const db = supabase as any;
  const { data, error } = await db.from("user_challenge_progress")
    .select("challenge_id,progress").eq("user_id", auth.user.id).eq("week_start", weekStart);
  if (error) throw new Error("تعذر تحميل التحديات.");
  return (data ?? []) as ChallengeProgress[];
}

export async function saveAccountChallengeProgress(weekStart: string, item: ChallengeProgress): Promise<boolean> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart) ||
      !["sessions", "walks", "water"].includes(item.challenge_id) ||
      !Number.isInteger(item.progress) || item.progress < 0 || item.progress > 10) {
    throw new Error("بيانات التحدي غير صحيحة.");
  }
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const db = supabase as any;
  const { error } = await db.from("user_challenge_progress").upsert({
    user_id: auth.user.id, week_start: weekStart,
    challenge_id: item.challenge_id, progress: item.progress,
  }, { onConflict: "user_id,week_start,challenge_id" });
  if (error) throw new Error("تعذر حفظ التقدم.");
  return true;
}
