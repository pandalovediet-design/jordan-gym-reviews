"use client";
import { useActionState } from "react";
import { setNewPassword } from "@/app/login/actions";

export default function Reset() {
  const [state, action, pending] = useActionState(setNewPassword, undefined);
  const field = "w-full rounded-xl bg-surface px-4 py-3 ring-1 ring-white/10 outline-none focus:ring-accent";
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-extrabold">كلمة مرور جديدة</h1>
      <form action={action} className="space-y-3">
        <input name="password" type="password" required minLength={8} placeholder="كلمة المرور الجديدة" autoComplete="new-password" dir="ltr" className={field} />
        <input name="confirm" type="password" required minLength={8} placeholder="أعد كتابتها" autoComplete="new-password" dir="ltr" className={field} />
        {state?.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
        <button disabled={pending} className="w-full rounded-xl bg-accent py-3 font-bold text-accent-foreground disabled:opacity-60">{pending ? "لحظة..." : "حفظ"}</button>
      </form>
    </div>
  );
}
