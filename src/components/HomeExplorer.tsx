/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EQUIPMENT, equipGradient, equipIcon, equipLabel, focusLabel, FOCUS, type Equipment } from "@/lib/home-meta";
import { LEVEL_LABEL } from "@/lib/exercise-meta";
import type { HomeWorkout } from "@/lib/home-workouts";

const pill = "whitespace-nowrap rounded-full px-4 py-1.5 text-sm ring-1 ring-white/10 transition-colors";

export function HomeExplorer({ items }: { items: HomeWorkout[] }) {
  const [eq, setEq] = useState<Equipment | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const eqCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) m.set(i.equipment, (m.get(i.equipment) ?? 0) + 1);
    return m;
  }, [items]);
  const focusUsed = useMemo(() => FOCUS.filter((f) => items.some((i) => i.focus === f && (!eq || i.equipment === eq))), [items, eq]);
  const shown = items.filter((i) => (!eq || i.equipment === eq) && (!focus || i.focus === focus));
  return (
    <div>
      <p className="mb-3 mt-8 text-sm font-bold text-muted">بدك تتمرن بشو؟</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
        <button type="button" onClick={() => { setEq(null); setFocus(null); }}
          className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-xs ring-1 ring-white/10 transition ${!eq ? "bg-accent font-bold text-accent-foreground" : "bg-surface hover:ring-accent"}`}>
          <span className="text-2xl">✨</span>الكل
        </button>
        {EQUIPMENT.filter((e) => eqCount.has(e)).map((e) => (
          <button key={e} type="button" onClick={() => { setEq(eq === e ? null : e); setFocus(null); }} aria-pressed={eq === e}
            className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-xs ring-1 ring-white/10 transition ${eq === e ? "bg-accent font-bold text-accent-foreground" : "bg-surface hover:ring-accent"}`}>
            <span className="text-2xl">{equipIcon(e)}</span>{equipLabel(e)}
            <span className={`text-[10px] ${eq === e ? "opacity-70" : "text-muted"}`}>{eqCount.get(e)} تمرين</span>
          </button>
        ))}
      </div>

      {focusUsed.length > 1 && (
        <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1">
          <button type="button" onClick={() => setFocus(null)} className={`${pill} ${!focus ? "bg-white font-bold text-black" : "bg-surface"}`}>كل العضلات</button>
          {focusUsed.map((f) => (
            <button key={f} type="button" onClick={() => setFocus(focus === f ? null : f)} aria-pressed={focus === f} className={`${pill} ${focus === f ? "bg-white font-bold text-black" : "bg-surface hover:ring-accent"}`}>{focusLabel(f)}</button>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-6 text-lg font-bold">{shown.length ? `${shown.length} تمرين` : "ما في تمارين بهالاختيار"}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
    </div>
  );
}
