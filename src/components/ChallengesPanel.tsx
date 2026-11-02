"use client";

import { useEffect, useState } from "react";

const challenges = [
  { id: "sessions", title: "3 حصص هذا الأسبوع", description: "خصص وقتاً لثلاث حصص رياضية", target: 3, unit: "حصص", icon: "🏋️" },
  { id: "walks", title: "4 مرات مشي", description: "أضف المشي إلى روتينك الأسبوعي", target: 4, unit: "مرات", icon: "🚶" },
  { id: "water", title: "5 أيام اهتمام بنفسك", description: "التزم بعادة صحية تختارها كل يوم", target: 5, unit: "أيام", icon: "💧" },
];
type Progress = Record<string, number>;

export function ChallengesPanel() {
  const [progress, setProgress] = useState<Progress>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("gymjo-challenge-progress-v1");
      if (raw) {
        const parsed = JSON.parse(raw) as { week: string; values: Progress };
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        const week = start.toISOString().slice(0, 10);
        if (parsed.week === week) setProgress(parsed.values ?? {});
      }
    } catch { /* Ignore invalid local progress. */ }
    setReady(true);
  }, []);
  function change(id: string, delta: number) {
    setProgress((current) => {
      const next = { ...current, [id]: Math.max(0, Math.min(challenges.find((x) => x.id === id)?.target ?? 99, (current[id] ?? 0) + delta)) };
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      try { localStorage.setItem("gymjo-challenge-progress-v1", JSON.stringify({ week: start.toISOString().slice(0, 10), values: next })); } catch { /* Storage may be unavailable. */ }
      return next;
    });
  }
  if (!ready) return <p className="text-sm text-muted">جاري تحميل تقدمك…</p>;
  const completed = challenges.filter((x) => (progress[x.id] ?? 0) >= x.target).length;
  return (
    <div>
      <div className="mb-5 rounded-2xl border border-accent/20 bg-accent/10 p-4">
        <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold">تقدمك هذا الأسبوع</p><p className="mt-1 text-xs text-muted">أنجز {completed} من {challenges.length} تحديات</p></div><strong className="text-2xl text-accent">{Math.round(completed / challenges.length * 100)}%</strong></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-accent transition-all" style={{ width: (completed / challenges.length * 100) + "%" }} /></div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {challenges.map((item) => {
          const count = progress[item.id] ?? 0;
          const done = count >= item.target;
          return (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-surface p-5">
              <div className="flex items-start justify-between gap-3"><span className="flex size-12 items-center justify-center rounded-2xl bg-background text-2xl">{item.icon}</span><span className={done ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300" : "rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent"}>{done ? "مكتمل ✓" : "مستمر"}</span></div>
              <h2 className="mt-4 font-black">{item.title}</h2><p className="mt-1 text-sm text-muted">{item.description}</p>
              <div className="mt-4 flex items-center justify-between"><span className="text-sm font-bold"><b className="text-accent">{count}</b> / {item.target} {item.unit}</span><div className="flex gap-2"><button type="button" onClick={() => change(item.id, -1)} disabled={count === 0} aria-label="تقليل التقدم" className="size-10 rounded-xl bg-background ring-1 ring-white/10 disabled:opacity-30">−</button><button type="button" onClick={() => change(item.id, 1)} disabled={done} aria-label="زيادة التقدم" className="size-10 rounded-xl bg-accent text-xl font-black text-accent-foreground disabled:opacity-30">+</button></div></div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-accent transition-all" style={{ width: Math.min(100, count / item.target * 100) + "%" }} /></div>
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-xs leading-6 text-muted">التحديات تجريبية وشخصية، وتُحفظ حالياً على هذا الجهاز. اضغط (+) بعد إنجاز النشاط؛ لا يوجد تحقق تلقائي من التمرين.</p>
    </div>
  );
}
