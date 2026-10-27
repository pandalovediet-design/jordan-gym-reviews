"use client";
import { useActionState, useState } from "react";
import { revealCode } from "@/app/deals/actions";

export function RevealCode({ id }: { id: string }) {
  const [state, run, pending] = useActionState(revealCode.bind(null, id), undefined);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const copyCode = async (code: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(code);
      setCopyStatus("copied");
    } catch {
      // Keep the code selectable so it can still be copied manually.
      setCopyStatus("failed");
    }
  };

  if (state?.ok) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <code dir="ltr" className="select-all rounded-lg bg-accent/15 px-3 py-1.5 font-mono text-sm font-bold tracking-wider text-accent">{state.ok}</code>
        <button
          type="button"
          onClick={() => void copyCode(state.ok!)}
          className="rounded-md px-2 py-1 text-xs text-muted underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="نسخ كود الخصم"
        >
          نسخ
        </button>
        <span role="status" aria-live="polite" className="text-xs text-muted">
          {copyStatus === "copied" ? "تم نسخ الكود" : copyStatus === "failed" ? "تعذّر النسخ تلقائيًا؛ حدّد الكود وانسخه يدويًا" : ""}
        </span>
      </div>
    );
  }

  return (
    <form action={run} className="flex flex-wrap items-center gap-2">
      <button type="submit" disabled={pending} className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
        {pending ? "لحظة..." : "جيب الكود"}
      </button>
      {pending && <span role="status" className="text-xs text-muted">جاري تجهيز كود الخصم…</span>}
      {state?.error && <span role="alert" className="text-xs text-red-300">{state.error}</span>}
    </form>
  );
}
