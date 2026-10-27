"use client";
import { useActionState } from "react";
import { reportListing } from "@/app/market/actions";

export function ReportListing({ id }: { id: string }) {
  const [state, run, pending] = useActionState(reportListing.bind(null, id), undefined);
  if (state?.ok) return <p role="status" aria-live="polite" className="text-xs leading-relaxed text-accent">{state.ok}</p>;

  return (
    <details className="min-w-0 text-xs text-muted">
      <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-lg py-2 pe-2 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none">🚩 الإبلاغ عن الإعلان</summary>
      <form action={run} aria-busy={pending} className="mt-2 flex flex-col gap-2 rounded-xl bg-surface p-3 ring-1 ring-white/10 sm:flex-row">
        <label htmlFor={`listing-report-${id}`} className="sr-only">سبب البلاغ (اختياري)</label>
        <input
          id={`listing-report-${id}`}
          name="reason"
          maxLength={200}
          autoComplete="off"
          placeholder="سبب البلاغ (اختياري)"
          className="min-h-11 min-w-0 flex-1 rounded-lg bg-background px-3 py-2 text-foreground ring-1 ring-white/10 outline-none transition placeholder:text-muted/80 focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none"
        />
        <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-white/10 px-4 py-2 font-semibold text-foreground transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none">
          {pending ? "جارٍ الإرسال..." : "إرسال البلاغ"}
        </button>
      </form>
      {pending && <p role="status" aria-live="polite" className="mt-2 leading-relaxed text-muted">جارٍ إرسال البلاغ، يرجى الانتظار…</p>}
      {state?.error && <p role="alert" className="mt-2 leading-relaxed text-red-300">{state.error}</p>}
    </details>
  );
}
