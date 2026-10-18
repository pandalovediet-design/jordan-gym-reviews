"use client";
import { useActionState, useState } from "react";
import { login, signup } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, action, pending] = useActionState(mode === "login" ? login : signup, undefined);
  const field = "w-full rounded-xl bg-surface px-4 py-3 ring-1 ring-white/10 outline-none focus:ring-accent";
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-extrabold">{mode === "login" ? "دخول الأنشطة" : "إنشاء حساب نشاط"}</h1>
      <form action={action} className="space-y-3" key={mode}>
        <input name="email" type="email" required placeholder="البريد الإلكتروني" autoComplete="email" dir="ltr" className={field} />
        <input name="password" type="password" required minLength={8} placeholder="كلمة المرور" autoComplete={mode === "login" ? "current-password" : "new-password"} dir="ltr" className={field} />
        {state?.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
        {state?.notice && <p className="text-sm text-accent">{state.notice}</p>}
        <button disabled={pending} className="w-full rounded-xl bg-accent py-3 font-bold text-accent-foreground disabled:opacity-60">
          {pending ? "لحظة..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
        </button>
      </form>
      <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-4 text-sm text-muted underline">
        {mode === "login" ? "عندك نشاط وما عندك حساب؟ سجّل الآن" : "عندك حساب؟ سجّل دخولك"}
      </button>
    </div>
  );
}
