"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";
import { notifyAdmin } from "@/lib/notify";

const schema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
});

export type AuthState = { error?: string; notice?: string } | undefined;

export async function login(_: AuthState, fd: FormData): Promise<AuthState> {
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(p.data);
  if (error) return { error: "البريد أو كلمة المرور غير صحيحة" };
  redirect("/dashboard");
}

export async function signup(_: AuthState, fd: FormData): Promise<AuthState> {
  if (String(fd.get("website") ?? "") !== "") return { error: "تعذّر إنشاء الحساب." }; // honeypot
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ ...p.data, options: { emailRedirectTo: `${await siteUrl()}/auth/callback?next=/dashboard` } });
  if (error) return { error: "تعذّر إنشاء الحساب. تأكد من البيانات أو جرّب بريد ثاني." };
  await notifyAdmin(`🆕 تسجيل جديد على Jordan Gym Reviews\n${p.data.email}`);
  if (!data.session) return { notice: "أرسلنا لك رابط تأكيد على بريدك. افتحه وبعدين سجّل دخولك." };
  redirect("/dashboard");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestReset(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = z.string().email().safeParse(fd.get("email"));
  if (!email.success) return { error: "البريد الإلكتروني غير صحيح" };
  const supabase = await createClient();
  // Same answer whether or not the account exists, so emails can't be probed.
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${await siteUrl()}/auth/callback?next=/auth/reset` });
  return { notice: "إذا كان البريد مسجّل عندنا، أرسلنا إليه رابط تعيين كلمة مرور جديدة." };
}

const resetSchema = z.object({
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { message: "كلمتا المرور غير متطابقتين", path: ["confirm"] });

export async function setNewPassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const p = resetSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "انتهت صلاحية الرابط. اطلب رابط جديد." };
  const { error } = await supabase.auth.updateUser({ password: p.data.password });
  if (error) return { error: "تعذّر تغيير كلمة المرور. جرّب كلمة مرور أقوى." };
  redirect("/dashboard");
}
