import type { ReactNode } from "react";

/**
 * One foldable block of the owner's editing page. Closed blocks keep the page short; opening one
 * shows exactly the same forms as before.
 */
export function Panel({ title, hint, open = false, children }: { title: ReactNode; hint?: ReactNode; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group rounded-2xl bg-surface ring-1 ring-white/10 open:ring-accent/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-lg font-bold">{title}</span>
          {hint && <span className="block text-xs text-muted">{hint}</span>}
        </span>
        <span aria-hidden className="text-muted transition group-open:rotate-180">▾</span>
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}
