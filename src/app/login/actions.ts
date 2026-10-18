"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(p.data);
  if (error) return { error: "تعذّر إنشاء الحساب. تأكد من البيانات أو جرّب بريد ثاني." };
  if (!data.session) return { notice: "أرسلنا لك رابط تأكيد على بريدك. افتحه وبعدين سجّل دخولك." };
  redirect("/dashboard");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
