"use client";
import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/app/dashboard/actions";

export const field = "w-full rounded-xl bg-background px-3 py-2.5 ring-1 ring-white/10 outline-none focus:ring-accent";

export function ActionForm({ action, children, submit = "حفظ", className = "space-y-3" }: {
  action: (s: FormState, fd: FormData) => Promise<FormState>; children: ReactNode; submit?: string; className?: string;
}) {
  const [state, run, pending] = useActionState(action, undefined);
  return (
    <form action={run} className={className}>
      {children}
      {state?.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
      {state?.ok && <p className="text-sm text-accent">{state.ok}</p>}
      <button disabled={pending} className="rounded-xl bg-accent px-6 py-2.5 font-bold text-accent-foreground disabled:opacity-60">{pending ? "لحظة..." : submit}</button>
    </form>
  );
}
