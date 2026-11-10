"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { deleteAccountMeal, getAccountFood, saveAccountMeals, saveAccountWater, type CloudMeal } from "@/app/food/actions";
import { claimLocalData } from "@/lib/member-sync";
import { addDays, ammanToday } from "@/lib/workout-log";
import {
  MEALS, NOTE_MAX, RATINGS, WATER_GOAL, WATER_MAX, healthyStreak, isHealthyDay, sanitizeFood, sanitizeWater, weekRatings,
  type FoodLog as Food, type MealId, type RatingId, type WaterLog,
} from "@/lib/food-log";

const FOOD_KEY = "gymjo:food-v1", WATER_KEY = "gymjo:water-v1", EVT = "gymjo:food-change";
const EMPTY_FOOD: Food = {}, EMPTY_WATER: WaterLog = {};
let foodCache: { raw: string | null; v: Food } = { raw: null, v: EMPTY_FOOD };
let waterCache: { raw: string | null; v: WaterLog } = { raw: null, v: EMPTY_WATER };

function readFood(): Food {
  try {
    const raw = localStorage.getItem(FOOD_KEY);
    if (raw !== foodCache.raw) foodCache = { raw, v: raw ? sanitizeFood(JSON.parse(raw)) : EMPTY_FOOD };
    return foodCache.v;
  } catch { return EMPTY_FOOD; }
}
function readWater(): WaterLog {
  try {
    const raw = localStorage.getItem(WATER_KEY);
    if (raw !== waterCache.raw) waterCache = { raw, v: raw ? sanitizeWater(JSON.parse(raw)) : EMPTY_WATER };
    return waterCache.v;
  } catch { return EMPTY_WATER; }
}
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb); window.addEventListener(EVT, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(EVT, cb); };
}
function store(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new Event(EVT)); } catch { /* storage blocked */ }
}

const ar = (n: number) => n.toLocaleString("ar-JO-u-nu-latn");
const DOW = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const dayName = (d: string, today: string) =>
  d === today ? "اليوم" : d === addDays(today, -1) ? "مبارح" : DOW[new Date(`${d}T00:00:00Z`).getUTCDay()];

function toCloud(food: Food): CloudMeal[] {
  return Object.entries(food).flatMap(([log_date, day]) =>
    MEALS.flatMap((m) => day[m.id] ? [{ log_date, meal: m.id, note: day[m.id]!.note, rating: day[m.id]!.rating }] : []));
}

export function FoodLog() {
  const food = useSyncExternalStore(subscribe, readFood, () => EMPTY_FOOD);
  const water = useSyncExternalStore(subscribe, readWater, () => EMPTY_WATER);
  const today = useSyncExternalStore(() => () => {}, ammanToday, () => "");
  const [selected, setSelected] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<MealId, string>>>({});
  const [editing, setEditing] = useState<MealId | null>(null);
  const [cloud, setCloud] = useState<"loading" | "synced" | "local" | "error">("loading");

  useEffect(() => {
    let alive = true;
    const since = addDays(ammanToday(), -400);
    getAccountFood(since).then(async (remote) => {
      if (!alive) return;
      if (remote === null) { setCloud("local"); return; }
      const fromAccount: Food = {};
      for (const m of remote.meals) (fromAccount[m.log_date] ??= {})[m.meal] = { note: m.note, rating: m.rating };
      const waterAccount: WaterLog = {};
      for (const w of remote.water) if (w.cups > 0) waterAccount[w.log_date] = w.cups;
      if (claimLocalData("food", remote.userId) === "replace") {
        store(FOOD_KEY, fromAccount); store(WATER_KEY, waterAccount); setCloud("synced");
        return;
      }
      // First sign-in on this device: add what was logged here before.
      const local = readFood(), localWater = readWater();
      const localOnly: Food = {};
      for (const [date, day] of Object.entries(local)) {
        for (const m of MEALS) if (day[m.id] && !fromAccount[date]?.[m.id]) (localOnly[date] ??= {})[m.id] = day[m.id];
      }
      const merged: Food = { ...local };
      for (const [date, day] of Object.entries(fromAccount)) merged[date] = { ...merged[date], ...day };
      const waterOnly = Object.entries(localWater).filter(([d]) => waterAccount[d] === undefined);
      store(FOOD_KEY, merged); store(WATER_KEY, { ...localWater, ...waterAccount });
      try {
        await saveAccountMeals(toCloud(localOnly));
        await saveAccountWater(waterOnly.map(([log_date, cups]) => ({ log_date, cups })));
        if (alive) setCloud("synced");
      } catch { if (alive) setCloud("error"); }
    }).catch(() => { if (alive) setCloud("error"); });
    return () => { alive = false; };
  }, []);

  if (!today) {
    return <div aria-busy="true" className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface motion-reduce:animate-none" />)}</div>;
  }

  const day = selected ?? today;
  const entries = food[day] ?? {};
  const streak = healthyStreak(food, today);
  const week = weekRatings(food, today);
  const cups = water[day] ?? 0;
  const box = "rounded-2xl bg-surface p-5 ring-1 ring-white/10";
  const sync = (p: Promise<{ signedIn: boolean }>) =>
    p.then((r) => setCloud(r.signedIn ? "synced" : "local")).catch(() => setCloud("error"));

  function rate(meal: MealId, rating: RatingId) {
    const note = (drafts[meal] ?? entries[meal]?.note ?? "").trim().slice(0, NOTE_MAX);
    const next: Food = { ...food, [day]: { ...food[day], [meal]: { note, rating } } };
    store(FOOD_KEY, next);
    setEditing(null);
    setDrafts((d) => ({ ...d, [meal]: undefined }));
    sync(saveAccountMeals([{ log_date: day, meal, note, rating }]));
  }
  function remove(meal: MealId) {
    const nextDay = { ...food[day] };
    delete nextDay[meal];
    const next: Food = { ...food };
    if (Object.keys(nextDay).length) next[day] = nextDay; else delete next[day];
    store(FOOD_KEY, next);
    setEditing(null);
    sync(deleteAccountMeal(day, meal));
  }
  function setCups(n: number) {
    const value = Math.max(0, Math.min(WATER_MAX, n));
    const next = { ...water };
    if (value) next[day] = value; else delete next[day];
    store(WATER_KEY, next);
    sync(saveAccountWater([{ log_date: day, cups: value }]));
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, -i)).reverse();

  return (
    <div className="space-y-5">
      <p aria-live="polite" className="text-xs text-muted">
        {cloud === "loading" ? "جارٍ تحميل سجلّك…" : cloud === "synced" ? "🔒 سجلّك محفوظ بحسابك وبيظهر على كل أجهزتك." : cloud === "local" ? "السجل محفوظ على هذا الجهاز فقط؛ سجّل الدخول لمزامنته." : "تعذرت المزامنة الآن؛ بياناتك محفوظة على الجهاز."}
      </p>

      <section className={`${box} text-center`}>
        <p className="text-5xl font-extrabold text-accent">{ar(streak)}</p>
        <p className="mt-1 text-sm">{streak === 1 ? "يوم أكل صحي" : "أيام أكل صحي ورا بعض 🥗"}</p>
        <p className="mt-2 text-xs text-muted">اليوم بينحسب صحي إذا سجّلت وجبتين أو أكثر وما فيهم أكلة حرة.</p>
        <div className="mt-4 flex justify-center gap-2 text-xs">
          {RATINGS.map((r) => <span key={r.id} className="rounded-full bg-background/60 px-3 py-1 ring-1 ring-white/10">{r.icon} {r.label}: {ar(week[r.id])}</span>)}
        </div>
        <p className="mt-2 text-[11px] text-muted">آخر 7 أيام</p>
      </section>

      <nav aria-label="اختر اليوم" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {days.map((d) => {
          const on = d === day, healthy = isHealthyDay(food[d]), logged = !!food[d];
          return (
            <button key={d} type="button" aria-pressed={on} onClick={() => { setSelected(d); setEditing(null); setDrafts({}); }}
              className={`flex min-h-14 min-w-16 flex-1 flex-col items-center justify-center rounded-xl text-xs ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${on ? "bg-accent font-bold text-accent-foreground ring-accent" : "bg-surface ring-white/10 hover:ring-accent"}`}>
              <span>{dayName(d, today)}</span>
              <span aria-hidden className="mt-0.5">{healthy ? "🥗" : logged ? "•" : " "}</span>
            </button>
          );
        })}
      </nav>

      <section className="space-y-3" aria-label={`وجبات ${dayName(day, today)}`}>
        {MEALS.map((m) => {
          const e = entries[m.id];
          const open = !e || editing === m.id;
          const rating = e && RATINGS.find((r) => r.id === e.rating);
          return (
            <article key={m.id} className={box}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold"><span aria-hidden>{m.icon}</span> {m.label}</h2>
                {e && !open && (
                  <div className="flex gap-1 text-xs">
                    <button type="button" onClick={() => { setEditing(m.id); setDrafts((d) => ({ ...d, [m.id]: e.note })); }} className="min-h-9 rounded-lg px-3 text-muted hover:bg-white/10 hover:text-foreground">تعديل</button>
                    <button type="button" onClick={() => remove(m.id)} className="min-h-9 rounded-lg px-3 text-muted hover:bg-white/10 hover:text-red-300">حذف</button>
                  </div>
                )}
              </div>
              {!open && e ? (
                <p className="mt-2 text-sm"><span className="me-2 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent">{rating?.icon} {rating?.label}</span>{e.note || <span className="text-muted">بدون وصف</span>}</p>
              ) : (
                <div className="mt-3 space-y-3">
                  <label className="sr-only" htmlFor={`food-${m.id}`}>شو أكلت على {m.label}؟</label>
                  <input id={`food-${m.id}`} value={drafts[m.id] ?? ""} maxLength={NOTE_MAX}
                    onChange={(ev) => setDrafts((d) => ({ ...d, [m.id]: ev.target.value }))}
                    placeholder="شو أكلت؟ (اختياري)"
                    className="min-h-11 w-full rounded-xl bg-background px-3 text-sm ring-1 ring-white/10 outline-none focus-visible:ring-2 focus-visible:ring-accent" />
                  <div className="grid grid-cols-3 gap-2">
                    {RATINGS.map((r) => (
                      <button key={r.id} type="button" onClick={() => rate(m.id, r.id)} aria-pressed={e?.rating === r.id}
                        className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-xs font-bold ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${e?.rating === r.id ? "bg-accent text-accent-foreground ring-accent" : "bg-background/60 ring-white/10 hover:ring-accent"}`}>
                        <span aria-hidden className="text-lg">{r.icon}</span>{r.label}
                      </button>
                    ))}
                  </div>
                  {editing === m.id && <button type="button" onClick={() => setEditing(null)} className="text-xs text-muted underline">إلغاء</button>}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <section className={`${box} space-y-3`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">💧 الماء</h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCups(cups - 1)} disabled={cups === 0} aria-label="كاسة أقل" className="size-11 rounded-xl bg-background text-xl ring-1 ring-white/10 disabled:opacity-30">−</button>
            <span className="min-w-14 text-center font-bold" aria-live="polite">{ar(cups)} {cups === 1 ? "كاسة" : "كاسات"}</span>
            <button type="button" onClick={() => setCups(cups + 1)} disabled={cups >= WATER_MAX} aria-label="كاسة زيادة" className="size-11 rounded-xl bg-accent text-xl font-black text-accent-foreground disabled:opacity-30">+</button>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${Math.min(100, (cups / WATER_GOAL) * 100)}%` }} /></div>
        <p className="text-xs text-muted">{cups >= WATER_GOAL ? `وصلت ${ar(WATER_GOAL)} كاسات 👏` : `هدف بسيط: ${ar(WATER_GOAL)} كاسات باليوم`}</p>
      </section>

      <Link href="/tools" className={`${box} flex items-center justify-between gap-3 transition-colors hover:ring-accent`}>
        <span><span className="block font-bold">🧮 حاسبة السعرات والبروتين</span><span className="block text-xs text-muted">بدك تعرف احتياجك اليومي؟ احسبه مرة وحدة.</span></span>
        <span aria-hidden className="text-muted">←</span>
      </Link>
    </div>
  );
}
