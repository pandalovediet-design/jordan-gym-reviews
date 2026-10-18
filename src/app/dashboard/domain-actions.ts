"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDomain, checkDomain, domainsEnabled, removeDomain } from "@/lib/vercel-domains";
import type { FormState } from "./actions";

const refresh = (id: string) => revalidatePath(`/dashboard/${id}/domain`);

function normalize(raw: string) {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
}

export async function connectDomain(id: string, _: FormState, fd: FormData): Promise<FormState> {
  if (!domainsEnabled()) return { error: "ربط الدومين غير مفعّل بعد." };
  const domain = normalize(String(fd.get("domain") ?? ""));
  if (!/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/.test(domain)) return { error: "اكتب دومين صحيح مثل: myGym.com" };
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase();
  if (domain.endsWith(".vercel.app") || (root && (domain === root || domain.endsWith(`.${root}`)))) return { error: "هاد الدومين يخص المنصة، اكتب دومينك الخاص." };
  const { supabase } = await requireUser();
  const { error: dbErr } = await supabase.from("org_domains").insert({ organization_id: id, domain });
  if (dbErr) return { error: dbErr.code === "23505" ? "هاد الدومين مستخدم أو عندك دومين مربوط." : "تعذّر حفظ الدومين." };
  const r = await addDomain(domain);
  if (!r.ok) {
    await supabase.from("org_domains").delete().eq("organization_id", id);
    return { error: r.code === "domain_already_in_use" ? "هاد الدومين مضاف على مشروع ثاني." : "تعذّر إضافة الدومين، جرّب لاحقاً." };
  }
  const writer = createAdminClient() ?? supabase;
  await writer.from("org_domains").update({ verification: r.info.verification }).eq("organization_id", id);
  refresh(id);
  return { ok: "تمت إضافة الدومين. اضبط سجلات DNS ثم اضغط «تحقق»." };
}

export async function verifyDomainAction(id: string): Promise<void> {
  if (!domainsEnabled()) return;
  const { supabase } = await requireUser();
  const { data: row } = await supabase.from("org_domains").select("domain").eq("organization_id", id).maybeSingle();
  if (!row) return;
  const info = await checkDomain(row.domain);
  const writer = createAdminClient() ?? supabase;
  if (info?.verified && info.misconfigured !== true) {
    await writer.from("org_domains").update({ status: "verified", verified_at: new Date().toISOString(), verification: info.verification }).eq("organization_id", id);
  } else if (info) {
    await writer.from("org_domains").update({ verification: info.verification }).eq("organization_id", id);
  }
  refresh(id);
}

export async function disconnectDomain(id: string): Promise<void> {
  const { supabase } = await requireUser();
  const { data: row } = await supabase.from("org_domains").select("domain").eq("organization_id", id).maybeSingle();
  if (!row) return;
  const { error } = await supabase.from("org_domains").delete().eq("organization_id", id);
  if (!error && domainsEnabled()) await removeDomain(row.domain);
  refresh(id);
}
