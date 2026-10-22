/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { BodyMap } from "@/components/BodyMap";
import { HomeSeries } from "@/components/HomeSeries";
import { EQUIPMENT, equipGradient, equipIcon, equipLabel, focusLabel, FOCUS, type Equipment } from "@/lib/home-meta";
import { LEVEL_LABEL, isMuscle, type Muscle } from "@/lib/exercise-meta";
import type { HomeWorkout } from "@/lib/home-workouts";

const pill = "whitespace-nowrap rounded-full px-4 py-1.5 text-sm ring-1 ring-white/10 transition-colors";
const BACK_SIDE = ["back", "triceps", "glutes", "hamstrings"];
const FRONT_SIDE = ["chest", "biceps", "abs", "quads"];
const toggle = <T,>(s: Set<T>, v: T) => { const n = new Set(s); if (n.has(v)) n.delete(v); else n.add(v); return n; };
const MAX_SERIES = 12;

export function HomeExplorer({ items }: { items: HomeWorkout[] }) {
  const [eq, setEq] = useState<Set<Equipment>>(new Set());
  const [focus, setFocus] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"front" | "back">("front");
  const [series, setSeries] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const eqCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) m.set(i.equipment, (m.get(i.equipment) ?? 0) + 1);
    return m;
  }, [items]);
  const shown = items.filter((i) => (!eq.size || eq.has(i.equipment as Equipment)) && (!focus.size || focus.has(i.focus)));
  // Routine order: cardio and full-body first (warm-up), then the rest as listed.
  const routine = useMemo(() => {
    const rank = (f: string) => (f === "cardio" ? 0 : f === "full_body" ? 1 : 2);
    return [...shown].sort((a, b) => rank(a.focus) - rank(b.focus)).slice(0, MAX_SERIES);
  }, [shown]);
  const focusUsed = FOCUS.filter((f) => items.some((i) => i.focus === f));
  const bodyActive = [...focus].filter(isMuscle) as Muscle[];

  const pickMuscle = (g: string, fromBody = false) => {
    setFocus((s) => toggle(s, g));
    setSeries(false);
    if (!focus.has(g)) {
      if (BACK_SIDE.includes(g)) setView("back");
      else if (FRONT_SIDE.includes(g)) setView("front");
    }
    if (fromBody && typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };
  const clear = () => { setEq(new Set()); setFocus(new Set()); setSeries(false); };
  const filtered = eq.size > 0 || focus.size > 0;

  return (
    <div className="mt-8 grid gap-8 md:grid-cols-[280px_1fr]">
      <div className="h-fit rounded-3xl bg-surface p-5 ring-1 ring-white/10 md:sticky md:top-4">
        <p className="mb-3 text-center text-sm font-bold">اختار العضلات</p>
        <div className="mb-3 flex justify-center gap-2 text-sm">
          {(["front", "back"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} className={`rounded-full px-4 py-1 ring-1 ring-white/10 ${view === v ? "bg-accent font-bold text-accent-foreground" : ""}`}>{v === "front" ? "أمامي" : "خلفي"}</button>
          ))}
        </div>
        <BodyMap view={view} active={bodyActive} onPick={(g) => pickMuscle(g, true)} />
        <p className="mt-2 text-center text-sm text-muted">{focus.size ? [...focus].map(focusLabel).join("، ") : "اضغط على عضلة أو أكثر"}</p>
      </div>

      <div ref={listRef} className="scroll-mt-4 min-w-0">
        <p className="mb-3 text-sm font-bold text-muted">بدك تتمرن بشو؟ <span className="font-normal">(اختار أداة أو أكثر)</span></p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {EQUIPMENT.filter((e) => eqCount.has(e)).map((e) => (
            <button key={e} type="button" onClick={() => { setEq((s) => toggle(s, e)); setSeries(false); }} aria-pressed={eq.has(e)}
              className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-xs ring-1 ring-white/10 transition ${eq.has(e) ? "bg-accent font-bold text-accent-foreground" : "bg-surface hover:ring-accent"}`}>
              <span className="text-2xl">{equipIcon(e)}</span>{equipLabel(e)}
              <span className={`text-[10px] ${eq.has(e) ? "opacity-70" : "text-muted"}`}>{eqCount.get(e)} تمرين</span>
            </button>
          ))}
        </div>

        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {focusUsed.map((f) => (
            <button key={f} type="button" onClick={() => pickMuscle(f)} aria-pressed={focus.has(f)} className={`${pill} ${focus.has(f) ? "bg-white font-bold text-black" : "bg-surface hover:ring-accent"}`}>{focusLabel(f)}</button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent/10 p-4 ring-1 ring-accent/30">
          <div>
            <p className="font-extrabold">{shown.length ? `${shown.length} تمرين مناسب` : "ما في تمارين بهالاختيار"}</p>
            <p className="text-xs text-muted">{shown.length ? `جهّزنا لك سلسلة كاملة${shown.length > MAX_SERIES ? ` (أول ${MAX_SERIES} تمرين)` : ""}، شغّلها تمرين ورا تمرين.` : "جرّب تشيل فلتر."}</p>
          </div>
          <div className="flex gap-2">
            {filtered && <button type="button" onClick={clear} className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20">مسح</button>}
            <button type="button" disabled={!routine.length} onClick={() => { setSeries(true); requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }}
              className="rounded-xl bg-accent px-5 py-2 text-sm font-extrabold text-accent-foreground hover:brightness-110 disabled:opacity-40">▶ ابدأ السلسلة ({routine.length})</button>
          </div>
        </div>

        {series && routine.length > 0 ? (
          <div className="mt-5"><HomeSeries key={routine.map((r) => r.id).join()} items={routine} onClose={() => setSeries(false)} /></div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
            {shown.map((w) => (
              <Link key={w.id} href={`/no-gym/${w.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-accent">
                {w.cover ? <img src={w.cover} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-105" />
                  : <span className={`absolute inset-0 bg-gradient-to-br ${equipGradient(w.equipment)}`}><span className="absolute inset-0 flex items-center justify-center text-6xl opacity-60">{equipIcon(w.equipment)}</span></span>}
                <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />
                <span className="absolute start-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] backdrop-blur">{equipIcon(w.equipment)} {equipLabel(w.equipment)}</span>
                <span className="absolute end-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-sm text-black transition group-hover:bg-accent">▶</span>
                <span className="absolute inset-x-0 bottom-0 p-3">
                  <span className="block text-sm font-bold leading-snug">{w.title}</span>
                  <span className="mt-1 flex flex-wrap gap-1 text-[10px] text-white/80">
                    <span className="rounded-full bg-white/15 px-2 py-0.5">{focusLabel(w.focus)}</span>
                    <span className="rounded-full bg-white/15 px-2 py-0.5">{LEVEL_LABEL[w.level]}</span>
                    {w.sets && <span className="rounded-full bg-accent/90 px-2 py-0.5 font-bold text-accent-foreground">{w.sets}</span>}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
