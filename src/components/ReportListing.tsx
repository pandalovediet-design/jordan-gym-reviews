"use client";
import { useActionState } from "react";
import { reportListing } from "@/app/market/actions";

export function ReportListing({ id }: { id: string }) {
  const [state, run, pending] = useActionState(reportListing.bind(null, id), undefined);
  if (state?.ok) return <span className="text-xs text-accent">{state.ok}</span>;
  return (
    <details className="text-xs text-muted">
      <summary className="cursor-pointer hover:text-foreground">🚩 بلّغ</summary>
      <form action={run} className="mt-2 flex gap-2">
        <input name="reason" maxLength={200} placeholder="السبب" className="min-w-0 flex-1 rounded-lg bg-background px-2 py-1 ring-1 ring-white/10" />
        <button disabled={pending} className="rounded-lg bg-white/10 px-3 py-1 disabled:opacity-60">إرسال</button>
      </form>
      {state?.error && <p role="alert" className="mt-1 text-red-300">{state.error}</p>}
    </details>
  );
}
