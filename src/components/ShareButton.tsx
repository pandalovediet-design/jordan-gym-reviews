"use client";
import { useEffect, useRef, useState } from "react";

type Status = "idle" | "sharing" | "shared" | "copied" | "error";

export function ShareButton({ text, url, label = "شارك" }: { text: string; url: string; label?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const announce = (next: "shared" | "copied" | "error") => {
    setStatus(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2600);
  };

  const share = async () => {
    if (status === "sharing" || status === "copied" || status === "shared") return;
    const shareData = { title: text, text, url };
    setStatus("sharing");
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        announce("shared");
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
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("idle");
        return;
      }
      announce("error");
    }
  };

  const labelText = status === "sharing"
    ? "جارٍ فتح المشاركة…"
    : status === "shared"
      ? "تمت المشاركة ✓"
      : status === "copied"
        ? "تم النسخ ✓"
        : status === "error"
          ? "تعذرت المشاركة — حاول مجددًا"
          : label;

  return (
    <button
      type="button"
      onClick={share}
      disabled={status === "sharing"}
      aria-label={status === "copied" ? "تم نسخ رابط المشاركة" : status === "shared" ? "تمت المشاركة بنجاح" : status === "error" ? "تعذرت المشاركة أو عملية النسخ" : labelText}
      aria-busy={status === "sharing"}
      className="no-print inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
    >
      {labelText}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {status === "sharing" ? "جارٍ فتح خيارات المشاركة." : status === "shared" ? "تمت المشاركة بنجاح." : status === "copied" ? "تم نسخ رابط المشاركة إلى الحافظة." : status === "error" ? "تعذرت المشاركة أو النسخ. تحقق من صلاحيات المتصفح وحاول مجددًا." : ""}
      </span>
    </button>
  );
}
