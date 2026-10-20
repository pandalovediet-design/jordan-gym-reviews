"use client";
import { useActionState } from "react";
import { deleteAccount } from "./actions";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, undefined);
  return (
    <form action={action} className="mt-4 space-y-3">
      <label className="block text-sm">اكتب <b>حذف</b> للتأكيد
        <input name="confirm" autoComplete="off" className="mt-1 w-full rounded-xl bg-background px-3 py-2 ring-1 ring-white/10" />
      </label>
      {state?.error && <p className="text-sm text-red-400" role="alert">{state.error}</p>}
      <button disabled={pending} className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{pending ? "جاري الحذف..." : "احذف حسابي"}</button>
    </form>
  );
}
