"use client";

import { useEffect, useState } from "react";
import { getAccountChallengeProgress, saveAccountChallengeProgress, type ChallengeId } from "@/app/challenges/actions";
import { claimLocalData, localWeekStart } from "@/lib/member-sync";

const challenges = [
  { id: "sessions", title: "3 حصص هذا الأسبوع", description: "خصص وقتاً لثلاث حصص رياضية", target: 3, unit: "حصص", icon: "🏋️" },
  { id: "walks", title: "4 مرات مشي", description: "أضف المشي إلى روتينك الأسبوعي", target: 4, unit: "مرات", icon: "🚶" },
  { id: "water", title: "5 أيام اهتمام بنفسك", description: "التزم بعادة صحية تختارها كل يوم", target: 5, unit: "أيام", icon: "💧" },
] as const;
type Progress = Partial<Record<ChallengeId, number>>;

const STORAGE_KEY = "gymjo-challenge-progress-v1";
function readLocal(week: string): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { week?: string; values?: Progress }) : null;
    return parsed?.week === week && parsed.values ? parsed.values : {};
  } catch {
    return {};
  }
}
function writeLocal(week: string, values: Progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ week, values })); } catch { /* Storage may be unavailable. */ }
}
const toItems = (values: Progress) =>
  challenges.flatMap((c) => typeof values[c.id] === "number" ? [{ challenge_id: c.id, progress: values[c.id] as number }] : []);

export function ChallengesPanel() {
  const [weekStart] = useState(localWeekStart);
  const [progress, setProgress] = useState<Progress>({});
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<"loading" | "synced" | "local" | "error">("loading");

  useEffect(() => {
    let alive = true;
    const local = readLocal(weekStart);
    getAccountChallengeProgress(weekStart)
      .then(async (remote) => {
        if (!alive) return;
        if (remote === null) { setProgress(local); setSync("local"); return; }
        const fromAccount: Progress = {};
        for (const item of remote.items) fromAccount[item.challenge_id] = item.progress;
        if (claimLocalData("challenges", remote.userId) === "replace") {
          setProgress(fromAccount);
          writeLocal(weekStart, fromAccount);
          setSync("synced");
          return;
        }
        const localOnly: Progress = {};
        for (const c of challenges) if (fromAccount[c.id] === undefined && typeof local[c.id] === "number") localOnly[c.id] = local[c.id];
        const merged = { ...local, ...fromAccount };
        setProgress(merged);
        writeLocal(weekStart, merged);
        await saveAccountChallengeProgress(weekStart, toItems(localOnly));
        if (alive) setSync("synced");
      })
      .catch(() => { if (alive) { setProgress(local); setSync("error"); } })
      .finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, [weekStart]);

  function change(id: ChallengeId, delta: number) {
    const target = challenges.find((x) => x.id === id)?.target ?? 10;
    const value = Math.max(0, Math.min(target, (progress[id] ?? 0) + delta));
    const next = { ...progress, [id]: value };
    setProgress(next);
    writeLocal(weekStart, next);
    saveAccountChallengeProgress(weekStart, [{ challenge_id: id, progress: value }])
      .then((ok) => setSync(ok ? "synced" : "local"))
      .catch(() => setSync("error"));
  }
  if (!ready) return <div aria-busy="true" aria-label="جاري تحميل تقدمك" className="grid gap-3 md:grid-cols-2">{[0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-surface motion-reduce:animate-none" />)}</div>;
  const completed = challenges.filter((x) => (progress[x.id] ?? 0) >= x.target).length;
  return (
    <div>
      <p aria-live="polite" className="mb-3 text-xs text-muted">{sync === "loading" ? "جارٍ تحميل تحدياتك…" : sync === "synced" ? "🔒 تقدمك محفوظ بحسابك." : sync === "local" ? "تقدمك محفوظ على هذا الجهاز؛ سجّل الدخول لمزامنته." : "تعذرت المزامنة الآن؛ تقدمك المحلي محفوظ."}</p>
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
      <p className="mt-4 text-xs leading-6 text-muted">التحديات شخصية؛ اضغط (+) بعد إنجاز النشاط. لا يوجد تحقق تلقائي من التمرين أو احتساب آلي من سجل النشاط.</p>
    </div>
  );
}
