"use client";
import Link from "next/link";
import { useState } from "react";
import { HomePlayer } from "@/components/HomePlayer";
import { equipIcon, equipLabel, focusLabel } from "@/lib/home-meta";
import type { HomeWorkout } from "@/lib/home-workouts";

/** Plays a whole routine: one exercise after the other, with progress and a "next" button. */
export function HomeSeries({ items, onClose }: { items: HomeWorkout[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const finished = i >= items.length;
  const cur = items[Math.min(i, items.length - 1)];
  const next = () => { setDone((d) => new Set(d).add(cur.id)); setI((x) => x + 1); };
  return (
    <div className="rounded-3xl bg-surface p-4 ring-1 ring-accent/40 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-accent">🔥 سلسلتك</p>
          <h2 className="text-xl font-extrabold">{finished ? "خلصت السلسلة 🎉" : `تمرين ${i + 1} من ${items.length}`}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-full bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20">إغلاق ✕</button>
      </div>
      <div className="mb-5 flex gap-1" aria-hidden>
        {items.map((w, k) => <span key={w.id} className={`h-1.5 flex-1 rounded-full ${k < i || done.has(w.id) ? "bg-accent" : k === i ? "bg-accent/50" : "bg-white/15"}`} />)}
      </div>

      {finished ? (
        <div className="py-8 text-center">
          <p className="text-5xl">💪</p>
          <p className="mt-3 text-lg font-bold">برافو! خلصت {items.length} تمارين</p>
          <p className="mt-1 text-sm text-muted">ارتاح دقيقتين واشرب مي. وإذا حبيت تطوّر، شوف النوادي القريبة منك.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => { setI(0); setDone(new Set()); }} className="rounded-xl bg-white/10 px-5 py-2 text-sm font-bold hover:bg-white/20">أعد السلسلة</button>
            <Link href="/directory" className="rounded-xl bg-accent px-5 py-2 text-sm font-bold text-accent-foreground">شوف النوادي ←</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="mx-auto w-full max-w-[260px]"><HomePlayer key={cur.id} url={cur.video_url} title={cur.title} cover={cur.cover} equipment={cur.equipment} /></div>
          <div>
            <h3 className="text-2xl font-black">{cur.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-accent px-3 py-1 font-bold text-accent-foreground">{equipIcon(cur.equipment)} {equipLabel(cur.equipment)}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{focusLabel(cur.focus)}</span>
              {cur.sets && <span className="rounded-full bg-white/10 px-3 py-1">🔁 {cur.sets}</span>}
            </div>
            <ol className="mt-4 space-y-1.5 text-sm">
              {cur.steps.map((s, k) => <li key={k} className="flex gap-2"><span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold">{k + 1}</span><span>{s}</span></li>)}
            </ol>
            {cur.mistake && <p className="mt-3 rounded-xl bg-red-500/10 p-2.5 text-xs text-red-200 ring-1 ring-red-400/30">⚠️ {cur.mistake}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button type="button" disabled={i === 0} onClick={() => setI((x) => Math.max(0, x - 1))} className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold hover:bg-white/20 disabled:opacity-40">→ السابق</button>
              <button type="button" onClick={next} className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground hover:brightness-110">{i === items.length - 1 ? "إنهاء ✓" : "خلصت، التالي ←"}</button>
              <Link href={`/no-gym/${cur.slug}`} className="text-xs text-accent underline">صفحة التمرين والمنتجات</Link>
            </div>
          </div>
        </div>
      )}

      <ol className="mt-6 grid gap-1.5 border-t border-white/10 pt-4 sm:grid-cols-2">
        {items.map((w, k) => (
          <li key={w.id}>
            <button type="button" onClick={() => setI(k)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm ${k === i && !finished ? "bg-accent/15 ring-1 ring-accent/50" : "bg-background/50 hover:bg-white/10"}`}>
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${done.has(w.id) || k < i ? "bg-accent text-accent-foreground" : "bg-white/15"}`}>{done.has(w.id) || k < i ? "✓" : k + 1}</span>
              <span className="min-w-0 flex-1 truncate">{w.title}</span>
              {w.sets && <span className="text-[11px] text-muted">{w.sets}</span>}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
