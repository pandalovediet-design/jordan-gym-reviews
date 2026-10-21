"use client";
import { useActionState } from "react";
import { revealCode } from "@/app/deals/actions";

export function RevealCode({ id }: { id: string }) {
  const [state, run, pending] = useActionState(revealCode.bind(null, id), undefined);
  if (state?.ok) {
    return (
      <div className="flex items-center gap-2">
        <code dir="ltr" className="select-all rounded-lg bg-accent/15 px-3 py-1.5 font-mono text-sm font-bold tracking-wider text-accent">{state.ok}</code>
        <button type="button" onClick={() => navigator.clipboard?.writeText(state.ok!).catch(() => {})} className="text-xs text-muted underline">نسخ</button>
      </div>
    );
  }
  return (
    <form action={run} className="flex items-center gap-2">
      <button disabled={pending} className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground disabled:opacity-60">{pending ? "لحظة..." : "جيب الكود"}</button>
      {state?.error && <span role="alert" className="text-xs text-red-300">{state.error}</span>}
    </form>
  );
}
