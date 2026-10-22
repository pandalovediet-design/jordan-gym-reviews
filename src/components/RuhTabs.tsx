"use client";
import { useState } from "react";
import { RestTimer } from "@/components/RestTimer";
import { Tasbeeh } from "@/components/Tasbeeh";
import type { RestContent } from "@/lib/quran";

export function RuhTabs({ content, quranClass }: { content: RestContent; quranClass: string }) {
  const [tab, setTab] = useState<"rest" | "tasbeeh">("rest");
  const t = (k: typeof tab, l: string) => (
    <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
      className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold ring-1 ring-white/10 transition ${tab === k ? "bg-accent text-accent-foreground" : "bg-surface hover:ring-accent"}`}>{l}</button>
  );
  return (
    <div className="mt-8">
      <div role="tablist" className="mb-5 flex gap-2">{t("rest", "⏱️ مؤقت الراحة القرآني")}{t("tasbeeh", "📿 المسبحة")}</div>
      {tab === "rest" ? <RestTimer content={content} quranClass={quranClass} /> : <Tasbeeh />}
    </div>
  );
}
