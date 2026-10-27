"use client";

import { useEffect, useRef, useState } from "react";

/** Copies text (usually a link) and announces the result accessibly. */
export function CopyButton({ text, label, className = "" }: { text: string; label: string; className?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual" | "copying">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const announce = (next: "copied" | "manual") => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setStatus(next);
    resetTimer.current = setTimeout(() => setStatus("idle"), 3000);
  };

  const copy = async () => {
    if (status === "copying") return;
    setStatus("copying");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      announce("copied");
    } catch {
      // Prompt is a fallback, not a successful copy; do not claim success if cancelled.
      if (typeof window.prompt !== "function") {
        announce("manual");
        return;
      }
      const result = window.prompt("تعذّر النسخ التلقائي. انسخ الرابط من هنا:", text);
      if (result === null) {
        if (resetTimer.current) clearTimeout(resetTimer.current);
        setStatus("idle");
        return;
      }
      announce("manual");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={copy}
        disabled={status === "copying"}
        aria-busy={status === "copying"}
        className={`inline-flex min-h-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none ${className}`}
        aria-label={status === "copied" ? "تم نسخ الرابط" : status === "manual" ? "تعذّر النسخ التلقائي، انسخ الرابط يدويًا" : status === "copying" ? "جارٍ نسخ الرابط" : label}
      >
        {status === "copying" ? "جارٍ النسخ…" : status === "copied" ? "✓ تم النسخ" : status === "manual" ? "انسخ الرابط يدويًا" : label}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {status === "copying" ? "جارٍ نسخ الرابط" : status === "copied" ? "تم نسخ الرابط إلى الحافظة" : status === "manual" ? "تعذّر النسخ التلقائي؛ انسخ الرابط من نافذة النسخ اليدوي إذا ظهرت" : ""}
      </span>
    </>
  );
}
