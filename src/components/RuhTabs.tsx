"use client";
import { useState } from "react";
import { RestTimer } from "@/components/RestTimer";
import { Tasbeeh } from "@/components/Tasbeeh";
import { PrayerTimes } from "@/components/PrayerTimes";
import { QuranPlayer } from "@/components/QuranPlayer";
import type { RestContent } from "@/lib/quran";

export function RuhTabs({ content, quranClass }: { content: RestContent; quranClass: string }) {
  const [tab, setTab] = useState<"rest" | "tasbeeh" | "prayer" | "listen">("rest");
  const t = (k: typeof tab, l: string) => (
    <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
      className={`flex-1 rounded-2xl px-2 py-3 text-sm font-bold ring-1 ring-white/10 transition ${tab === k ? "bg-accent text-accent-foreground" : "bg-surface hover:ring-accent"}`}>{l}</button>
  );
  return (
    <div className="mt-8">
      <div role="tablist" className="mb-5 flex gap-2">{t("rest", "⏱️ المؤقت")}{t("tasbeeh", "📿 المسبحة")}{t("prayer", "🕌 الصلاة")}{t("listen", "🎧 استماع")}</div>
      {tab === "rest" ? <RestTimer content={content} quranClass={quranClass} /> : tab === "tasbeeh" ? <Tasbeeh /> : tab === "prayer" ? <PrayerTimes /> : <QuranPlayer quranClass={quranClass} />}
    </div>
  );
}
