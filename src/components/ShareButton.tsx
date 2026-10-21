"use client";
import { useState } from "react";

export function ShareButton({ text, url, label = "شارك" }: { text: string; url: string; label?: string }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text, url });
      else { await navigator.clipboard.writeText(`${text} ${url}`); setDone(true); setTimeout(() => setDone(false), 2000); }
    } catch { /* user cancelled */ }
  };
  return <button type="button" onClick={share} className="no-print rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">{done ? "اننسخ ✓" : label}</button>;
}
