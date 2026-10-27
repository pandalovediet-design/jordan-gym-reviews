"use client";
import { useState } from "react";

/** Copies a text (a link) and says so for a moment. */
export function CopyButton({ text, label, className = "" }: { text: string; label: string; className?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { window.prompt?.("انسخ الرابط:", text); }
  };
  return <button type="button" onClick={copy} className={className}>{done ? "✓ انتسخ" : label}</button>;
}
