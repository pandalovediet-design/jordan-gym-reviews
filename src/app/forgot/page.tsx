"use client";
import { useActionState } from "react";
import Link from "next/link";
import { requestReset } from "@/app/login/actions";

export default function Forgot() {
  const [state, action, pending] = useActionState(requestReset, undefined);
  const field = "min-h-12 w-full rounded-xl bg-surface px-4 py-3 text-base text-foreground ring-1 ring-white/10 placeholder:text-muted/80 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const button = "inline-flex min-h-12 items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  return (
    <section className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="mb-6 rounded-3xl border border-white/10 bg-surface/70 p-5 shadow-xl shadow-black/10 sm:p-7">
        <span className="text-xs font-bold tracking-wide text-accent">استعادة الحساب</span>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">نسيت كلمة المرور؟</h1>
        <p className="mt-3 text-sm leading-6 text-muted">أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.</p>
      </div>
      <form action={action} className="space-y-4">
        <label className="block space-y-1.5 text-sm font-semibold">
          <span>البريد الإلكتروني</span>
          <input name="email" type="email" required placeholder="name@example.com" autoComplete="email" dir="ltr" className={field} />
        </label>
        {state?.error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm leading-6 text-red-300 ring-1 ring-red-400/20">{state.error}</p>}
        {state?.notice && <p role="status" className="rounded-xl bg-accent/10 p-3 text-sm leading-6 text-accent ring-1 ring-accent/20">{state.notice}</p>}
        <button type="submit" disabled={pending} className={`${button} w-full bg-accent text-accent-foreground hover:brightness-110 disabled:cursor-wait disabled:opacity-60`}>
          {pending ? "جارٍ إرسال الرابط…" : "إرسال رابط الاستعادة"}
        </button>
      </form>
      <Link href="/login" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-muted underline underline-offset-4 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">← الرجوع إلى تسجيل الدخول</Link>
    </section>
  );
}
