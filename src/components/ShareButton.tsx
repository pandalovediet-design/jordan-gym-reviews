"use client";
import { useEffect, useRef, useState } from "react";

export function ShareButton({ text, url, label = "شارك" }: { text: string; url: string; label?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const announce = (next: "copied" | "error") => {
    setStatus(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2600);
  };

  const share = async () => {
    if (status === "copied") return;
    const shareData = { title: text, text, url };
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        setStatus("idle");
        return;
      }
      if (!navigator.clipboard?.writeText) {
        announce("error");
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      announce("copied");
    } catch (error) {
      // Share-sheet cancellation is expected and should not be reported as a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      announce("error");
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label={status === "copied" ? "تم نسخ رابط المشاركة" : status === "error" ? "تعذرت المشاركة أو عملية النسخ" : label}
      className="no-print inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none"
    >
      {status === "copied" ? "تم النسخ ✓" : status === "error" ? "تعذرت المشاركة — حاول مجددًا" : label}
      <span className="sr-only" role="status" aria-live="polite">
        {status === "copied" ? "تم نسخ رابط المشاركة إلى الحافظة." : status === "error" ? "تعذرت المشاركة أو النسخ. تحقق من صلاحيات المتصفح وحاول مجددًا." : ""}
      </span>
    </button>
  );
}
