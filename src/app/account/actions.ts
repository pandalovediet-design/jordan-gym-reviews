"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/notify";

export type AccountState = { error?: string } | undefined;

/** Permanently deletes the signed-in user, the businesses they created, and everything attached to them. */
export async function deleteAccount(_: AccountState, fd: FormData): Promise<AccountState> {
  const { user } = await requireUser();
  if (String(fd.get("confirm") ?? "").trim() !== "حذف") return { error: "اكتب كلمة «حذف» للتأكيد." };
  const admin = createAdminClient();
  if (!admin) return { error: "الخدمة غير متاحة حالياً، تواصل معنا." };
  await admin.from("review_responses").delete().eq("created_by", user.id);
  const { error: orgErr } = await admin.from("organizations").delete().eq("created_by", user.id);
  if (orgErr) return { error: "تعذّر حذف أنشطتك. تواصل معنا لنحذفها يدوياً." };
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "تعذّر حذف الحساب. تواصل معنا." };
  await notifyAdmin(`🗑️ حساب انحذف\n${user.email}`);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
