"use server";

import { createClient } from "@/lib/supabase/server";

export type ChallengeId = "sessions" | "walks" | "water";
export type ChallengeProgress = { challenge_id: ChallengeId; progress: number };

const IDS: readonly string[] = ["sessions", "walks", "water"];
const WEEK = /^\d{4}-\d{2}-\d{2}$/;
const isChallengeId = (id: unknown): id is ChallengeId => typeof id === "string" && IDS.includes(id);

export async function getAccountChallengeProgress(weekStart: string): Promise<{ userId: string; items: ChallengeProgress[] } | null> {
  if (!WEEK.test(weekStart)) throw new Error("الأسبوع غير صحيح.");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from("user_challenge_progress")
    .select("challenge_id,progress").eq("user_id", auth.user.id).eq("week_start", weekStart);
  if (error) throw new Error("تعذر تحميل التحديات.");
  const items = (data ?? []).flatMap((row) => isChallengeId(row.challenge_id) ? [{ challenge_id: row.challenge_id, progress: row.progress }] : []);
  return { userId: auth.user.id, items };
}

export async function saveAccountChallengeProgress(weekStart: string, items: ChallengeProgress[]): Promise<boolean> {
  if (!WEEK.test(weekStart) || !Array.isArray(items) || items.length > IDS.length ||
      items.some((item) => !isChallengeId(item?.challenge_id) || !Number.isInteger(item.progress) || item.progress < 0 || item.progress > 10)) {
    throw new Error("بيانات التحدي غير صحيحة.");
  }
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  if (!items.length) return true;
  const { error } = await supabase.from("user_challenge_progress").upsert(
    items.map((item) => ({ user_id: auth.user.id, week_start: weekStart, challenge_id: item.challenge_id, progress: item.progress })),
    { onConflict: "user_id,week_start,challenge_id" },
  );
  if (error) throw new Error("تعذر حفظ التقدم.");
  return true;
}
