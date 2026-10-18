"use client";
import { useActionState } from "react";
import Link from "next/link";
import { requestReset } from "@/app/login/actions";

export default function Forgot() {
  const [state, action, pending] = useActionState(requestReset, undefined);
  const field = "w-full rounded-xl bg-surface px-4 py-3 ring-1 ring-white/10 outline-none focus:ring-accent";
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-2xl font-extrabold">نسيت كلمة المرور</h1>
      <p className="mb-6 text-sm text-muted">اكتب بريدك وبنرسل لك رابط لتعيين كلمة مرور جديدة.</p>
      <form action={action} className="space-y-3">
        <input name="email" type="email" required placeholder="البريد الإلكتروني" autoComplete="email" dir="ltr" className={field} />
        {state?.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
        {state?.notice && <p className="text-sm text-accent">{state.notice}</p>}
        <button disabled={pending} className="w-full rounded-xl bg-accent py-3 font-bold text-accent-foreground disabled:opacity-60">{pending ? "لحظة..." : "أرسل الرابط"}</button>
      </form>
      <Link href="/login" className="mt-4 inline-block text-sm text-muted underline">← رجوع للدخول</Link>
    </div>
  );
}
