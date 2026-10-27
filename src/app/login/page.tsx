"use client";
import { useState, Suspense } from "react";
import { useKeepForm } from "@/components/Form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login, signup } from "./actions";

function LoginForm() {
  const sp = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(sp.get("mode") === "signup" ? "signup" : "login");
  const { state, onSubmit, pending, ref } = useKeepForm(mode === "login" ? login : signup);
  const linkError = sp.get("error") === "link";
  const next = sp.get("next") ?? "";
  const field = "min-h-12 w-full rounded-xl bg-surface px-4 py-3 text-base text-foreground ring-1 ring-white/10 placeholder:text-muted/80 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";
  const button = "inline-flex min-h-12 items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] motion-reduce:transform-none motion-reduce:transition-none";
  return (
    <section className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="mb-6 rounded-3xl border border-white/10 bg-surface/70 p-5 shadow-xl shadow-black/10 sm:p-7">
        <p className="mb-2 text-xs font-bold tracking-wide text-accent">JORDAN GYM REVIEWS</p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{mode === "login" ? "دخول الأنشطة" : "إنشاء حساب نشاط"}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{mode === "login" ? "أهلاً بعودتك، سجّل دخولك لإدارة نشاطك." : "أنشئ حسابك وابدأ بإدارة صفحة نشاطك."}</p>
      </div>
      <form ref={ref} onSubmit={onSubmit} className="space-y-4" key={mode}>
        <label className="block space-y-1.5 text-sm font-semibold">
          <span>البريد الإلكتروني</span>
          <input name="email" type="email" required placeholder="name@example.com" autoComplete="email" dir="ltr" className={field} />
        </label>
        {next && <input type="hidden" name="next" value={next} />}
        {mode === "signup" && <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />}
        <label className="block space-y-1.5 text-sm font-semibold">
          <span>كلمة المرور</span>
          <input name="password" type="password" required minLength={8} placeholder="8 أحرف على الأقل" autoComplete={mode === "login" ? "current-password" : "new-password"} dir="ltr" className={field} />
        </label>
        {linkError && !state && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm leading-6 text-red-300 ring-1 ring-red-400/20">الرابط منتهي أو غير صالح. اطلب رابطًا جديدًا.</p>}
        {state?.error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm leading-6 text-red-300 ring-1 ring-red-400/20">{state.error}</p>}
        {state?.notice && <p role="status" className="rounded-xl bg-accent/10 p-3 text-sm leading-6 text-accent ring-1 ring-accent/20">{state.notice}</p>}
        <button type="submit" disabled={pending} className={`${button} w-full bg-accent text-accent-foreground hover:brightness-110 disabled:cursor-wait disabled:opacity-60`}>
          {pending ? "جارٍ المعالجة…" : mode === "login" ? "دخول الحساب" : "إنشاء الحساب"}
        </button>
      </form>
      {mode === "login" && <p className="mt-4 text-sm"><Link href="/forgot" className="inline-flex min-h-11 items-center text-muted underline decoration-white/30 underline-offset-4 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">نسيت كلمة المرور؟</Link></p>}
      {mode === "signup" && <p className="mt-4 text-xs leading-6 text-muted">بإنشاء الحساب أنت توافق على <Link href="/terms" className="underline underline-offset-4 hover:text-accent">الشروط</Link> و<Link href="/privacy" className="underline underline-offset-4 hover:text-accent">سياسة الخصوصية</Link>.</p>}
      <div className="mt-5 border-t border-white/10 pt-4">
        <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className={`${button} w-full text-muted underline underline-offset-4 hover:bg-white/5 hover:text-accent`}>
          {mode === "login" ? "عندك نشاط وما عندك حساب؟ سجّل الآن" : "عندك حساب؟ سجّل دخولك"}
        </button>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-sm text-muted" role="status">جارٍ تحميل صفحة الدخول…</div>}><LoginForm /></Suspense>;
}
