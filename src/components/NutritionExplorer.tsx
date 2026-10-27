/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { NutritionCalc } from "@/components/NutritionCalc";
import { NutritionSeries } from "@/components/NutritionSeries";
import { KIND_LABEL, MEALS, mealGradient, mealIcon, mealLabel } from "@/lib/nutrition-meta";
import type { NutritionItem } from "@/lib/nutrition";

const toggle = <T,>(s: Set<T>, v: T) => { const n = new Set(s); if (n.has(v)) n.delete(v); else n.add(v); return n; };
const MAX_SERIES = 12;

export function NutritionExplorer({ items, presets = [] }: { items: NutritionItem[]; presets?: { id: string; title: string; description: string | null; ids: string[] }[] }) {
  const [preset, setPreset] = useState<string | null>(null);
  const [meals, setMeals] = useState<Set<string>>(new Set());
  const [kind, setKind] = useState<"" | "video" | "plan">("");
  const [series, setSeries] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const count = useMemo(() => { const m = new Map<string, number>(); for (const i of items) m.set(i.meal, (m.get(i.meal) ?? 0) + 1); return m; }, [items]);
  const shown = items.filter((i) => (!meals.size || meals.has(i.meal)) && (!kind || i.kind === kind));
  const routine = useMemo(() => {
    const rank = (m: string) => MEALS.indexOf(m as (typeof MEALS)[number]);
    return [...shown].sort((a, b) => rank(a.meal) - rank(b.meal)).slice(0, MAX_SERIES);
  }, [shown]);
  const presetList = useMemo(() => {
    const p = presets.find((x) => x.id === preset);
    const m = new Map(items.map((i) => [i.id, i]));
    return p ? p.ids.map((id) => m.get(id)).filter((x): x is NutritionItem => !!x) : null;
  }, [preset, presets, items]);
  const list = presetList ?? routine;
  const filtered = meals.size > 0 || kind !== "";
  const pill = "whitespace-nowrap rounded-full px-4 py-1.5 text-sm ring-1 ring-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const clearFilters = () => { setMeals(new Set()); setKind(""); setPreset(null); setSeries(false); };
  return (
    <div className="mt-8 grid gap-8 md:grid-cols-[320px_1fr]">
      <div className="h-fit md:sticky md:top-4"><NutritionCalc /></div>
      <div ref={listRef} className="scroll-mt-4 min-w-0">
        {presets.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-sm font-bold text-muted">⭐ سلاسل جاهزة</p>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2" aria-label="السلاسل الجاهزة">
              {presets.map((p) => (
                <button key={p.id} type="button" onClick={() => { setPreset(p.id); setSeries(true); requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }}
                  aria-pressed={preset === p.id}
                  className={`min-w-[200px] max-w-[260px] shrink-0 rounded-2xl bg-accent/10 p-3 text-start ring-1 transition hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${preset === p.id ? "ring-accent" : "ring-accent/40"}`}>
                  <span className="block text-sm font-extrabold">▶ {p.title}</span>
                  {p.description && <span className="mt-0.5 block text-[11px] text-muted">{p.description}</span>}
                  <span className="mt-1 block text-[10px] text-accent">{p.ids.length} عناصر</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="mb-3 text-sm font-bold text-muted">شو بدك تاكل؟ <span className="font-normal">(اختار وجبة أو أكثر)</span></p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label="تصفية حسب الوجبة">
          {MEALS.map((m) => (
            <button key={m} type="button" onClick={() => { setMeals((s) => toggle(s, m)); setPreset(null); setSeries(false); }} aria-pressed={meals.has(m)}
              className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-xs ring-1 ring-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${meals.has(m) ? "bg-accent font-bold text-accent-foreground" : "bg-surface hover:ring-accent"}`}>
              <span className="text-2xl" aria-hidden="true">{mealIcon(m)}</span>{mealLabel(m)}
              <span className={`text-[10px] ${meals.has(m) ? "opacity-70" : "text-muted"}`}>{count.get(m) ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="نوع المحتوى">
          {([[ "", "الكل"], ["video", "🎬 فيديو"], ["plan", "📋 خطط"]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => { setKind(k); setPreset(null); setSeries(false); }} aria-pressed={kind === k} className={`${pill} ${kind === k ? "bg-white font-bold text-black" : "bg-surface hover:ring-accent"}`}>{l}</button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent/10 p-4 ring-1 ring-accent/30">
          <div aria-live="polite" aria-atomic="true">
            <p className="font-extrabold">{shown.length ? `${shown.length} وصفة وخطة` : "ما في شي بهالاختيار"}</p>
            <p className="text-xs text-muted">{shown.length ? "شغّلها كيوم كامل: فطور، غداء، عشاء…" : "جرّب تغيّر الفلاتر أو امسحها لعرض كل المحتوى."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(filtered || preset) && <button type="button" onClick={clearFilters} className={`${pill} bg-white/10 hover:bg-white/20`}>مسح الفلاتر</button>}
            <button type="button" disabled={!routine.length} onClick={() => { setPreset(null); setSeries(true); requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }}
              className="rounded-xl bg-accent px-5 py-2 text-sm font-extrabold text-accent-foreground hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40">▶ ابدأ السلسلة ({routine.length})</button>
          </div>
        </div>
        {series && list.length > 0 ? (
          <div className="mt-5"><NutritionSeries key={list.map((r) => r.id).join()} items={list} onClose={() => setSeries(false)} /></div>
        ) : shown.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label="الوصفات والخطط">
            {shown.map((w) => (
              <Link key={w.id} href={`/no-deprivation/${w.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                {w.cover ? <img src={w.cover} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-105" />
                  : <span className={`absolute inset-0 bg-gradient-to-br ${mealGradient(w.meal)}`}><span className="absolute inset-0 flex items-center justify-center text-6xl opacity-60">{mealIcon(w.meal)}</span></span>}
                <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />
                <span className="absolute start-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] backdrop-blur">{mealIcon(w.meal)} {mealLabel(w.meal)}</span>
                <span className="absolute end-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-black">{KIND_LABEL[w.kind as "video" | "plan"] ?? w.kind}</span>
                <span className="absolute inset-x-0 bottom-0 p-3">
                  <span className="block text-sm font-bold leading-snug">{w.title}</span>
                  <span className="mt-1 flex flex-wrap gap-1 text-[10px] text-white/80">
                    {w.calories != null && <span className="rounded-full bg-accent/90 px-2 py-0.5 font-bold text-accent-foreground">{w.calories} سعرة</span>}
                    {w.protein != null && <span className="rounded-full bg-white/15 px-2 py-0.5">بروتين {w.protein}g</span>}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/10 bg-surface p-8 text-center" role="status">
            <p className="text-lg font-extrabold">ما لقينا نتائج مطابقة</p>
            <p className="mt-2 text-sm text-muted">جرّب وجبة ثانية أو اعرض كل الوصفات والخطط.</p>
            <button type="button" onClick={clearFilters} className={`${pill} mt-4 bg-accent font-bold text-accent-foreground`}>عرض كل المحتوى</button>
          </div>
        )}
      </div>
    </div>
  );
}
