"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/notify";
import { normPhone } from "@/lib/phone";
import type { FormState } from "@/app/dashboard/actions";

/** A signed-in person asks to take over an unclaimed listing. The platform owner approves it from /admin/outreach. */
export async function requestClaim(orgId: string, _: FormState, fd: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "سجّل دخولك أول." };
  const name = String(fd.get("contact_name") ?? "").trim();
  const phone = normPhone(String(fd.get("phone") ?? ""));
  const role = String(fd.get("role") ?? "").trim().slice(0, 60);
  const note = String(fd.get("note") ?? "").trim().slice(0, 500);
  if (name.length < 2) return { error: "اكتب اسمك." };
  if (!phone) return { error: "اكتب رقم هاتف صحيح، مثلاً 0791234567." };
  const { data: org } = await supabase.from("organizations").select("name_ar,slug,is_claimed").eq("id", orgId).maybeSingle();
  if (!org || org.is_claimed !== false) return { error: "هاي الصفحة مستلَمة أو مش متاحة للاستلام." };
  const { error } = await supabase.from("claim_requests").insert({ organization_id: orgId, user_id: auth.user.id, contact_name: name, phone, role: role || null, note: note || null });
  if (error) return { error: error.code === "23505" ? "طلبك موجود أصلاً، وبنراجعه قريباً." : "ما وصل الطلب. جرّب كمان مرة." };
  await notifyAdmin(`🏁 طلب استلام صفحة\n${org.name_ar}\n${name} · ${phone}${role ? ` · ${role}` : ""}\n${auth.user.email ?? ""}\nراجعه من لوحة الإدارة ← التواصل والاستلام`);
  revalidatePath(`/claim/${org.slug}`);
  return { ok: "وصل طلبك ✅ بنتواصل معك على رقمك للتأكد، وبعد الموافقة بتلاقي النادي بلوحتك." };
}
