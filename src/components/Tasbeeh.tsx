"use client";
import { useEffect, useState } from "react";

const ADHKAR = [
  { id: "subhan-wbhamdih", text: "سبحان الله وبحمده" },
  { id: "istighfar", text: "أستغفر الله" },
  { id: "hawqala", text: "لا حول ولا قوة إلا بالله" },
  { id: "subhanallah", text: "سبحان الله" },
  { id: "alhamdulillah", text: "الحمد لله" },
  { id: "allahu-akbar", text: "الله أكبر" },
  { id: "la-ilaha", text: "لا إله إلا الله" },
  { id: "subhan-azim", text: "سبحان الله العظيم" },
] as const;
const KEY = "jgr-tasbeeh-v1";
const ar = (n: number) => n.toLocaleString("ar-EG");
const TARGETS = [33, 100, 0] as const;

type State = { id: string; counts: Record<string, number>; target: number; reps: boolean; perSet: number; sets: number };
const init: State = { id: ADHKAR[0].id, counts: {}, target: 33, reps: false, perSet: 12, sets: 0 };

export function Tasbeeh() {
  const [s, setS] = useState<State>(init);
  const [loaded, setLoaded] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const d = JSON.parse(localStorage.getItem(KEY) ?? "null");
        if (d && typeof d === "object") {
          const counts: Record<string, number> = {};
          if (d.counts && typeof d.counts === "object") for (const a of ADHKAR) { const v = Number(d.counts[a.id]); if (Number.isFinite(v) && v >= 0) counts[a.id] = Math.min(v, 1_000_000); }
          setS({
            id: ADHKAR.some((a) => a.id === d.id) ? d.id : init.id, counts,
            target: TARGETS.includes(d.target) ? d.target : init.target, reps: d.reps === true,
            perSet: Number.isInteger(d.perSet) && d.perSet >= 1 && d.perSet <= 100 ? d.perSet : init.perSet,
            sets: Number.isInteger(d.sets) && d.sets >= 0 && d.sets < 1000 ? d.sets : 0,
          });
        }
      } catch {}
      setLoaded(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  }, [loaded, s]);

  const cur = ADHKAR.find((a) => a.id === s.id) ?? ADHKAR[0];
  const count = s.counts[s.id] ?? 0;
  const goal = s.reps ? s.perSet : s.target;

  const tap = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(12);
    setS((p) => {
      const next = (p.counts[p.id] ?? 0) + 1;
      const g = p.reps ? p.perSet : p.target;
      if (g > 0 && next >= g) {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([120, 60, 120]);
        setFlash(true); setTimeout(() => setFlash(false), 900);
        return { ...p, counts: { ...p.counts, [p.id]: 0 }, sets: p.reps ? p.sets + 1 : p.sets };
      }
      return { ...p, counts: { ...p.counts, [p.id]: next } };
    });
  };
  const reset = () => setS((p) => ({ ...p, counts: { ...p.counts, [p.id]: 0 }, sets: 0 }));
  const total = Object.values(s.counts).reduce((a, b) => a + b, 0);
  const pct = goal > 0 ? Math.min(100, (count / goal) * 100) : 0;
  const chip = (on: boolean) => `rounded-full px-3 py-1.5 text-sm ring-1 ring-white/10 ${on ? "bg-accent font-bold text-accent-foreground" : "bg-background/50 hover:ring-accent"}`;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-surface p-5 ring-1 ring-white/10">
        <p className="mb-3 text-center text-sm font-bold">📿 اختار الذكر</p>
        <div className="flex flex-wrap justify-center gap-2">
          {ADHKAR.map((a) => <button key={a.id} type="button" onClick={() => setS((p) => ({ ...p, id: a.id }))} aria-pressed={s.id === a.id} className={chip(s.id === a.id)}>{a.text}</button>)}
        </div>

        <p className="mt-6 text-center text-2xl font-extrabold" dir="rtl">{cur.text}</p>
        <button type="button" onClick={tap} aria-label={`عدّ ${cur.text}`}
          className={`relative mx-auto mt-4 flex size-52 touch-manipulation select-none flex-col items-center justify-center rounded-full ring-4 transition active:scale-95 ${flash ? "bg-accent text-accent-foreground ring-white" : "bg-background ring-accent/60"}`}
          style={goal > 0 ? { backgroundImage: `conic-gradient(rgba(16,185,129,0.35) ${pct}%, transparent 0)` } : undefined}>
          <span className="text-6xl font-black tabular-nums">{ar(count)}</span>
          <span className="mt-1 text-xs opacity-70">{goal > 0 ? `من ${ar(goal)}` : "عدّ مفتوح"}</span>
        </button>
        {s.reps && <p className="mt-3 text-center text-sm text-accent">جولات مكتملة: <b>{ar(s.sets)}</b></p>}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
          {!s.reps && TARGETS.map((t) => <button key={t} type="button" onClick={() => setS((p) => ({ ...p, target: t }))} className={chip(s.target === t)}>{t === 0 ? "مفتوح" : ar(t)}</button>)}
          <button type="button" onClick={reset} className="rounded-full bg-white/10 px-4 py-1.5 hover:bg-white/20">تصفير</button>
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-4 ring-1 ring-white/10">
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span><span className="block text-sm font-bold">🏋️ ذكر مع العدّات</span><span className="block text-xs text-muted">كل جولة تمرين = عدد ضغطات تحدده، وبنحسب الجولات.</span></span>
          <input type="checkbox" checked={s.reps} onChange={(e) => setS((p) => ({ ...p, reps: e.target.checked, counts: { ...p.counts, [p.id]: 0 }, sets: 0 }))} className="size-5 accent-emerald-500" />
        </label>
        {s.reps && (
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="text-muted">عدد العدّات بالجولة</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setS((p) => ({ ...p, perSet: Math.max(1, p.perSet - 1) }))} className="size-8 rounded-full bg-white/10 text-lg">−</button>
              <b className="w-8 text-center tabular-nums">{ar(s.perSet)}</b>
              <button type="button" onClick={() => setS((p) => ({ ...p, perSet: Math.min(100, p.perSet + 1) }))} className="size-8 rounded-full bg-white/10 text-lg">+</button>
            </div>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-muted">مجموع اللي عدّيته بهالجهاز: {ar(total)}</p>
    </div>
  );
}
