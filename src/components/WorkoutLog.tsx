"use client";
import { useState, useSyncExternalStore } from "react";
import { GOALS, KINDS, MINUTES, addDays, bestStreak, daysThisWeek, dow, monthCount, sanitize, streak, weekStart, ammanToday, type Log } from "@/lib/workout-log";

const KEY = "jgr:log-v1", GOAL_KEY = "jgr:log-goal", EVT = "jgr:log-change";
const EMPTY: Log = {};
let cache: { raw: string | null; log: Log } = { raw: null, log: EMPTY };
function read(): Log {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.log;
    cache = { raw, log: raw ? sanitize(JSON.parse(raw)) : EMPTY };
    return cache.log;
  } catch { return EMPTY; }
}
const readGoal = () => { try { const g = Number(localStorage.getItem(GOAL_KEY)); return (GOALS as readonly number[]).includes(g) ? g : 3; } catch { return 3; } };
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb); window.addEventListener(EVT, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(EVT, cb); };
}
const save = (log: Log) => { try { localStorage.setItem(KEY, JSON.stringify(log)); window.dispatchEvent(new Event(EVT)); } catch {} };

const ar = (n: number) => n.toLocaleString("ar-JO-u-nu-latn");
const MONTHS = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
const DOW = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

function message(s: number, today: boolean): string {
  if (s === 0) return "ابدأ اليوم، يوم واحد بيكفي لتبدأ السلسلة.";
  if (s < 3) return today ? "بداية حلوة! كمّل بكرة." : "سلسلتك لسا حيّة، تمرّن اليوم وما تقطعها.";
  if (s < 7) return "ماشي صح 💪 قرّبت على الأسبوع.";
  if (s < 30) return "أسبوع وزيادة! الالتزام هو السر.";
  return "ما شاء الله، شهر من الالتزام. استمر 🔥";
}

export function WorkoutLog() {
  const log = useSyncExternalStore(subscribe, read, () => EMPTY);
  const goal = useSyncExternalStore(subscribe, readGoal, () => 3);
  const today = useSyncExternalStore(() => () => {}, ammanToday, () => "");
  const [kind, setKind] = useState<string>(KINDS[0]);
  const [min, setMin] = useState<number>(45);
  const [backup, setBackup] = useState("");
  const [note, setNote] = useState("");

  if (!today) return <p className="text-sm text-muted">لحظة...</p>;

  const done = !!log[today];
  const s = streak(log, today), best = bestStreak(log), week = daysThisWeek(log, today);
  const chip = (on: boolean) => `rounded-full px-3 py-1.5 text-sm ring-1 ring-white/10 ${on ? "bg-accent font-bold text-accent-foreground" : "bg-background/50 hover:ring-accent"}`;
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";

  const toggleDay = (d: string) => {
    const next = { ...log };
    if (next[d]) delete next[d]; else next[d] = { kind: d === today ? kind : "تمرين", min: d === today ? min : 0 };
    save(next);
  };
  const setGoal = (g: number) => { try { localStorage.setItem(GOAL_KEY, String(g)); window.dispatchEvent(new Event(EVT)); } catch {} };

  // calendar for the current month, weeks start on Sunday
  const first = `${today.slice(0, 7)}-01`;
  const monthDays: (string | null)[] = Array.from({ length: dow(first) }, () => null);
  for (let d = first; d.slice(0, 7) === today.slice(0, 7); d = addDays(d, 1)) monthDays.push(d);
  const wk = Array.from({ length: 7 }, (_, i) => addDays(weekStart(today), i));

  return (
    <div className="space-y-5">
      <section className={`${box} text-center`}>
        <p className="text-5xl font-extrabold text-accent">{ar(s)}</p>
        <p className="mt-1 text-sm">{s === 1 ? "يوم متتالي" : "يوم متتالي 🔥"}</p>
        <p className="mt-2 text-xs text-muted">{message(s, done)}</p>
        <p className="mt-3 text-xs text-muted">أطول سلسلة: {ar(best)} · هالشهر: {ar(monthCount(log, today))} يوم</p>
      </section>

      <section className={`${box} space-y-4`}>
        {done ? (
          <div className="text-center">
            <p className="font-bold text-accent">✅ سجّلت تمرين اليوم ({log[today].kind}{log[today].min ? ` · ${ar(log[today].min)} دقيقة` : ""})</p>
            <button type="button" onClick={() => toggleDay(today)} className="mt-2 text-xs text-muted underline">إلغاء تسجيل اليوم</button>
          </div>
        ) : (
          <>
            <p className="font-bold">شو تمرنت اليوم؟</p>
            <div className="flex flex-wrap gap-2">{KINDS.map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={chip(kind === k)}>{k}</button>)}</div>
            <p className="text-xs text-muted">المدة</p>
            <div className="flex flex-wrap gap-2">{MINUTES.map((m) => <button key={m} type="button" aria-pressed={min === m} onClick={() => setMin(m)} className={chip(min === m)}>{ar(m)} دقيقة</button>)}</div>
            <button type="button" onClick={() => toggleDay(today)} className="w-full rounded-xl bg-accent py-3 text-lg font-extrabold text-accent-foreground active:scale-[0.99]">تمرنت اليوم ✓</button>
          </>
        )}
      </section>

      <section className={`${box} space-y-3`}>
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold">هدف الأسبوع</p>
          <select value={goal} onChange={(e) => setGoal(Number(e.target.value))} aria-label="هدف الأسبوع" className="rounded-lg bg-background px-2 py-1 text-sm ring-1 ring-white/10">
            {GOALS.map((g) => <option key={g} value={g}>{ar(g)} أيام</option>)}
          </select>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
          {wk.map((d) => (
            <div key={d} className={`rounded-lg py-2 ${log[d] ? "bg-accent font-bold text-accent-foreground" : d === today ? "ring-1 ring-accent" : "bg-background/50 text-muted"}`}>{DOW[dow(d)]}</div>))}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (week / goal) * 100)}%` }} /></div>
        <p className="text-xs text-muted">{week >= goal ? "حققت هدف الأسبوع، ما شاء الله 🎉" : `${ar(week)} من ${ar(goal)}، باقي ${ar(goal - week)}`}</p>
      </section>

      <section className={box}>
        <p className="mb-3 font-bold">{MONTHS[Number(today.slice(5, 7)) - 1]} {ar(Number(today.slice(0, 4)))}</p>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthDays.map((d, i) => d === null ? <span key={`e${i}`} /> : (
            <button key={d} type="button" disabled={d > today} onClick={() => toggleDay(d)} aria-label={`${d}${log[d] ? " تمرنت" : ""}`} aria-pressed={!!log[d]}
              className={`aspect-square rounded-lg text-xs ${log[d] ? "bg-accent font-bold text-accent-foreground" : d === today ? "ring-1 ring-accent" : "bg-background/50"} ${d > today ? "opacity-30" : ""}`}>{ar(Number(d.slice(8)))}</button>))}
        </div>
        <p className="mt-2 text-xs text-muted">دوس على أي يوم فات لتسجله أو تلغيه (لو نسيت).</p>
      </section>

      <section className={`${box} space-y-2 text-xs text-muted`}>
        <p>🔒 السجل محفوظ على جهازك فقط، بدون حساب. لو غيّرت الجهاز أو مسحت بيانات المتصفح بينمسح، فخذ نسخة احتياطية:</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setBackup(JSON.stringify(log)); setNote("انسخ النص تحت واحفظه عندك."); }} className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20">نسخة احتياطية</button>
          <button type="button" onClick={() => { try { const l = sanitize(JSON.parse(backup)); if (!Object.keys(l).length) throw new Error(); save({ ...log, ...l }); setNote("تم الاسترجاع ✓"); } catch { setNote("النص مش صحيح."); } }} className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20">استرجاع من النص</button>
        </div>
        <textarea value={backup} onChange={(e) => setBackup(e.target.value)} dir="ltr" rows={3} placeholder="الصق النسخة الاحتياطية هون للاسترجاع" className="w-full rounded-xl bg-background p-2 text-[11px] ring-1 ring-white/10 outline-none focus:ring-accent" />
        {note && <p className="text-accent">{note}</p>}
      </section>
    </div>
  );
}
