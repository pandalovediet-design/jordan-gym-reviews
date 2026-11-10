"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export async function markAllRead(): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.rpc("mark_notifications_read");
  revalidatePath("/notifications");
  revalidatePath("/account");
}

export async function clearNotifications(): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from("notifications").delete().eq("user_id", user.id);
  revalidatePath("/notifications");
  revalidatePath("/account");
}
