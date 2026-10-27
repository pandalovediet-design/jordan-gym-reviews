"use client";

import { useEffect, useRef, useState } from "react";

/** Copies a text (usually a link) and announces the result accessibly. */
export function CopyButton({ text, label, className = "" }: { text: string; label: string; className?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const announce = (next: "copied" | "manual") => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setStatus(next);
    resetTimer.current = setTimeout(() => setStatus("idle"), 2500);
  };

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      announce("copied");
    } catch {
      setStatus("manual");
      const result = window.prompt?.("تعذّر النسخ التلقائي. انسخ الرابط من هنا:", text);
      if (result !== null && result !== undefined) announce("manual");
    }
  };

  return (
    <>
      <button type="button" onClick={copy} className={className} aria-label={status === "copied" ? "تم نسخ الرابط" : label}>
        {status === "copied" ? "✓ تم النسخ" : status === "manual" ? "انسخ الرابط يدويًا" : label}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {status === "copied" ? "تم نسخ الرابط إلى الحافظة" : status === "manual" ? "استخدم نافذة النسخ اليدوي إذا ظهرت" : ""}
      </span>
    </>
  );
}
