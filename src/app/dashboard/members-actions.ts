"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { addDays, toIntl } from "@/lib/format";
import type { FormState } from "./actions";

const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
const today = () => new Date().toISOString().slice(0, 10);
const refresh = (id: string) => revalidatePath(`/dashboard/${id}/members`);

const planSchema = z.object({
  name_ar: z.string().trim().min(2, "اكتب اسم الباقة").max(80),
  duration_days: z.coerce.number().int().min(1, "المدة بالأيام").max(800),
  price_jod: z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().min(0).max(100000).nullable()),
});
export async function addPlan(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const p = planSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("membership_plans").insert({ ...p.data, organization_id: id });
  if (error) return { error: "تعذّرت إضافة الباقة" };
  refresh(id);
  return { ok: "تمت إضافة الباقة" };
}
export async function deletePlan(id: string, planId: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("membership_plans").delete().eq("id", planId).eq("organization_id", id);
  refresh(id);
}

const memberSchema = z.object({
  full_name: z.string().trim().min(2, "اكتب اسم العضو").max(80),
  phone: z.string().trim().min(7, "اكتب رقم الهاتف"),
  plan_id: opt(40),
  starts_on: z.string().optional(),
  days: z.string().optional(),
  notes: opt(500),
});
export async function addMember(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const p = memberSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const phone = toIntl(p.data.phone);
  if (!phone || !/^\+[1-9][0-9]{7,14}$/.test(phone)) return { error: "رقم الهاتف غير صحيح" };
  const { supabase } = await requireUser();
  let days = Number(p.data.days) || 0;
  if (p.data.plan_id) {
    const { data: plan } = await supabase.from("membership_plans").select("duration_days").eq("id", p.data.plan_id).eq("organization_id", id).maybeSingle();
    if (!plan) return { error: "الباقة غير موجودة" };
    days = days || plan.duration_days;
  }
  if (days < 1) return { error: "اختر باقة أو اكتب عدد الأيام" };
  const starts = p.data.starts_on || today();
  const { error } = await supabase.from("org_members").insert({
    organization_id: id, full_name: p.data.full_name, phone, plan_id: p.data.plan_id, starts_on: starts, ends_on: addDays(starts, days), notes: p.data.notes,
  });
  if (error) return { error: "تعذّرت إضافة العضو" };
  refresh(id);
  return { ok: "تمت إضافة العضو" };
}

export async function renewMember(id: string, memberId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { data: m } = await supabase.from("org_members").select("ends_on,plan_id").eq("id", memberId).eq("organization_id", id).maybeSingle();
  if (!m) return;
  let days = 30;
  if (m.plan_id) {
    const { data: plan } = await supabase.from("membership_plans").select("duration_days").eq("id", m.plan_id).maybeSingle();
    if (plan) days = plan.duration_days;
  }
  const from = m.ends_on > today() ? m.ends_on : today();
  await supabase.from("org_members").update({ starts_on: from, ends_on: addDays(from, days) }).eq("id", memberId).eq("organization_id", id);
  refresh(id);
}
export async function setCoachNote(id: string, memberId: string, fd: FormData): Promise<void> {
  const { supabase } = await requireUser();
  const note = String(fd.get("coach_note") ?? "").trim().slice(0, 500) || null;
  await supabase.from("org_members").update({ coach_note: note }).eq("id", memberId).eq("organization_id", id);
  refresh(id);
}
export async function deleteMember(id: string, memberId: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("org_members").delete().eq("id", memberId).eq("organization_id", id);
  refresh(id);
}

const programSchema = z.object({
  kind: z.enum(["workout", "nutrition"]),
  title: z.string().trim().min(2, "اكتب عنوان البرنامج").max(120),
  body: z.string().trim().min(1, "اكتب محتوى البرنامج").max(20000),
});
export async function addProgram(id: string, memberId: string, _: FormState, fd: FormData): Promise<FormState> {
  const p = programSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const { supabase } = await requireUser();
  const { error } = await supabase.from("member_programs").insert({ ...p.data, organization_id: id, member_id: memberId });
  if (error) return { error: "تعذّر حفظ البرنامج" };
  refresh(id);
  return { ok: "تم حفظ البرنامج، استخدم زر واتساب لإرساله" };
}
export async function deleteProgram(id: string, programId: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("member_programs").delete().eq("id", programId).eq("organization_id", id);
  refresh(id);
}
