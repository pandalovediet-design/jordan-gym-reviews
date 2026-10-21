"use server";
import { createPublicClient } from "@/lib/supabase/public";
import { notifyAdmin } from "@/lib/notify";
import type { FormState } from "@/app/dashboard/actions";

const UUID = /^[0-9a-f-]{36}$/i;

export async function countView(id: string): Promise<void> {
  if (!UUID.test(id)) return;
  await createPublicClient().rpc("count_video_view", { p_id: id });
}

export async function reportVideo(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!UUID.test(id)) return { error: "فيديو غير صالح" };
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 200);
  const { data, error } = await createPublicClient().rpc("report_video", { p_id: id, p_reason: reason });
  if (error || !data) return { error: "تعذّر إرسال البلاغ" };
  await notifyAdmin(`🚩 بلاغ على فيديو\n${reason || "بدون سبب"}`);
  return { ok: "وصلنا البلاغ، شكراً." };
}
