"use client";
import { useState } from "react";

export function ShareButton({ text, url, label = "شارك" }: { text: string; url: string; label?: string }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setDone(true);
        window.setTimeout(() => setDone(false), 2200);
      }
    } catch {
      // A dismissed share sheet is a normal user action; do not show a false success state.
    }
  };
  return (
    <button
      type="button"
      onClick={share}
      aria-live="polite"
      className="no-print inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none"
    >
      {done ? "تم النسخ ✓" : label}
    </button>
  );
}
