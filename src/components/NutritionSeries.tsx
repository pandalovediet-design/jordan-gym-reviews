"use client";
import Link from "next/link";
import { useState } from "react";
import { HomePlayer } from "@/components/HomePlayer";
import { RichText } from "@/components/RichText";
import { mealGradient, mealIcon, mealLabel } from "@/lib/nutrition-meta";
import type { NutritionItem } from "@/lib/nutrition";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

/** Plays the day: item after item (videos or written plans), ordered by meal. */
export function NutritionSeries({ items, onClose }: { items: NutritionItem[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const finished = i >= items.length;
  const cur = items[Math.min(i, items.length - 1)];
  const next = () => { if (!cur) return; setDone((d) => new Set(d).add(cur.id)); setI((x) => x + 1); };
  return (
    <section aria-label="سلسلة التغذية اليومية" className="rounded-3xl bg-surface p-4 ring-1 ring-accent/40 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div aria-live="polite" aria-atomic="true">
          <p className="text-xs font-bold text-accent">🥗 يومك</p>
          <h2 className="text-xl font-extrabold">{finished ? "خلص يومك 🎉" : `${i + 1} من ${items.length}`}</h2>
        </div>
        <button type="button" onClick={onClose} className={`rounded-full bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20 ${focusRing}`}>إغلاق ✕</button>
      </div>
      <div className="mb-5 flex gap-1" role="progressbar" aria-label="التقدم في السلسلة" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={Math.min(i, items.length)} aria-valuetext={finished ? "اكتملت السلسلة" : `أنجزت ${Math.min(i, items.length)} من ${items.length}`}>
        {items.map((w, k) => <span key={w.id} aria-hidden="true" className={`h-1.5 flex-1 rounded-full ${k < i || done.has(w.id) ? "bg-accent" : k === i ? "bg-accent/50" : "bg-white/15"}`} />)}
      </div>
      {finished ? (
        <div className="py-8 text-center" role="status">
          <p className="text-5xl" aria-hidden="true">🥗</p>
          <p className="mt-3 text-lg font-bold">برافو! خلصت {items.length} وصفات وخطط</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => { setI(0); setDone(new Set()); }} className={`rounded-xl bg-white/10 px-5 py-2 text-sm font-bold hover:bg-white/20 ${focusRing}`}>أعد من البداية</button>
            <Link href="/no-gym" className={`rounded-xl bg-accent px-5 py-2 text-sm font-bold text-accent-foreground ${focusRing}`}>تمارين من البيت ←</Link>
          </div>
        </div>
      ) : cur ? (
        <div className={cur.video_url ? "grid gap-6 md:grid-cols-[260px_1fr]" : ""}>
          {cur.video_url && <div className="mx-auto w-full max-w-[260px]"><HomePlayer key={cur.id} url={cur.video_url} title={cur.title} cover={cur.cover} icon={mealIcon(cur.meal)} gradient={mealGradient(cur.meal)} /></div>}
          <div>
            <h3 className="text-2xl font-black">{cur.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-accent px-3 py-1 font-bold text-accent-foreground">{mealIcon(cur.meal)} {mealLabel(cur.meal)}</span>
              {cur.calories != null && <span className="rounded-full bg-white/10 px-3 py-1">🔥 {cur.calories} سعرة</span>}
              {cur.protein != null && <span className="rounded-full bg-white/10 px-3 py-1">بروتين {cur.protein}g</span>}
            </div>
            {cur.summary && <p className="mt-3 text-sm text-muted">{cur.summary}</p>}
            {cur.body && <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl bg-background/50 p-3"><RichText text={cur.body} /></div>}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button type="button" disabled={i === 0} onClick={() => setI((x) => Math.max(0, x - 1))} className={`rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}>→ السابق</button>
              <button type="button" onClick={next} className={`rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground hover:brightness-110 ${focusRing}`}>{i === items.length - 1 ? "إنهاء ✓" : "التالي ←"}</button>
              <Link href={`/no-deprivation/${cur.slug}`} className={`rounded px-1 text-xs text-accent underline ${focusRing}`}>الصفحة والمنتجات</Link>
            </div>
          </div>
        </div>
      ) : null}
      <ol aria-label="عناصر السلسلة" className="mt-6 grid gap-1.5 border-t border-white/10 pt-4 sm:grid-cols-2">
        {items.map((w, k) => (
          <li key={w.id}>
            <button type="button" onClick={() => setI(k)} aria-current={k === i && !finished ? "step" : undefined} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm ${focusRing} ${k === i && !finished ? "bg-accent/15 ring-1 ring-accent/50" : "bg-background/50 hover:bg-white/10"}`}>
              <span className="shrink-0" aria-hidden="true">{done.has(w.id) || k < i ? "✓" : mealIcon(w.meal)}</span>
              <span className="min-w-0 flex-1 truncate">{w.title}</span>
              {k === i && !finished && <span className="shrink-0 text-[10px] font-bold text-accent">الحالي</span>}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
