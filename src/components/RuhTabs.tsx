"use client";
import { useState } from "react";
import { RestTimer } from "@/components/RestTimer";
import { Tasbeeh } from "@/components/Tasbeeh";
import { PrayerTimes } from "@/components/PrayerTimes";
import { QuranPlayer } from "@/components/QuranPlayer";
import type { RestContent } from "@/lib/quran";

export function RuhTabs({ content, quranClass }: { content: RestContent; quranClass: string }) {
  const [tab, setTab] = useState<"rest" | "tasbeeh" | "prayer" | "listen">("rest");
  const tabs: { key: typeof tab; label: string }[] = [
    { key: "rest", label: "⏱️ المؤقت" }, { key: "tasbeeh", label: "📿 المسبحة" },
    { key: "prayer", label: "🕌 الصلاة" }, { key: "listen", label: "🎧 استماع" },
  ];
  const t = (k: typeof tab, l: string) => (
    <button key={k} id={`ruh-tab-${k}`} type="button" role="tab" aria-controls="ruh-tab-panel" aria-selected={tab === k} tabIndex={tab === k ? 0 : -1}
      onClick={() => setTab(k)} onKeyDown={(e) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
        e.preventDefault();
        const current = tabs.findIndex((x) => x.key === k);
        const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (current + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        const nextTab = tabs[next].key;
        setTab(nextTab);
        requestAnimationFrame(() => document.getElementById(`ruh-tab-${nextTab}`)?.focus());
      }}
      className={`flex-1 rounded-2xl px-2 py-3 text-sm font-bold ring-1 ring-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${tab === k ? "bg-accent text-accent-foreground" : "bg-surface hover:ring-accent"}`}>{l}</button>
  );
  return (
    <div className="mt-8">
      <div role="tablist" aria-label="أدوات الراحة والذكر" className="mb-5 flex gap-2">{tabs.map(({ key, label }) => t(key, label))}</div>
      <div id="ruh-tab-panel" role="tabpanel" aria-labelledby={`ruh-tab-${tab}`} tabIndex={0} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        {tab === "rest" ? <RestTimer content={content} quranClass={quranClass} /> : tab === "tasbeeh" ? <Tasbeeh /> : tab === "prayer" ? <PrayerTimes /> : <QuranPlayer quranClass={quranClass} />}
      </div>
    </div>
  );
}
