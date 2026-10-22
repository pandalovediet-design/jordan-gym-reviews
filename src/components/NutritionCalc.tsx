"use client";
import { useMemo, useState } from "react";
import { ACTIVITY, GOALS, calc, type Goal, type Sex } from "@/lib/body-calc";

const inp = "w-full rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-white/10 focus:outline-none focus:ring-accent";
const n = (v: string) => (v.trim() === "" ? null : Number(v));
const Stat = ({ k, v, sub }: { k: string; v: string; sub?: string }) => (
  <div className="rounded-xl bg-background/60 p-3 text-center ring-1 ring-white/10"><p className="text-[11px] text-muted">{k}</p><p className="text-lg font-black">{v}</p>{sub && <p className="text-[10px] text-muted">{sub}</p>}</div>
);

export function NutritionCalc() {
  const [sex, setSex] = useState<Sex>("m");
  const [f, setF] = useState({ age: "25", height: "175", weight: "75", bf: "", neck: "", waist: "", hip: "" });
  const [activity, setActivity] = useState(1.375);
  const [goal, setGoal] = useState<Goal>("maintain");
  const [adv, setAdv] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const r = useMemo(() => calc({ sex, age: Number(f.age), height: Number(f.height), weight: Number(f.weight), activity, goal, bodyFat: n(f.bf), neck: n(f.neck), waist: n(f.waist), hip: n(f.hip) }), [sex, f, activity, goal]);
  return (
    <div className="rounded-3xl bg-surface p-5 ring-1 ring-white/10">
      <p className="mb-3 text-center text-sm font-bold">🧮 حاسبة السعرات والـFFM</p>
      <div className="mb-3 flex justify-center gap-2 text-sm">
        {([["m", "ذكر"], ["f", "أنثى"]] as const).map(([v, l]) => <button key={v} type="button" onClick={() => setSex(v)} aria-pressed={sex === v} className={`rounded-full px-5 py-1 ring-1 ring-white/10 ${sex === v ? "bg-accent font-bold text-accent-foreground" : ""}`}>{l}</button>)}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <label>العمر<input inputMode="numeric" value={f.age} onChange={set("age")} className={inp} /></label>
        <label>الطول (سم)<input inputMode="decimal" value={f.height} onChange={set("height")} className={inp} /></label>
        <label>الوزن (كغ)<input inputMode="decimal" value={f.weight} onChange={set("weight")} className={inp} /></label>
      </div>
      <label className="mt-2 block text-xs">نشاطك
        <select value={activity} onChange={(e) => setActivity(Number(e.target.value))} className={inp}>{ACTIVITY.map((a) => <option key={a.v} value={a.v}>{a.label}</option>)}</select>
      </label>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {(Object.keys(GOALS) as Goal[]).map((g) => <button key={g} type="button" onClick={() => setGoal(g)} aria-pressed={goal === g} className={`rounded-xl px-2 py-1.5 text-xs ring-1 ring-white/10 ${goal === g ? "bg-white font-bold text-black" : "bg-background/50"}`}>{GOALS[g].label}</button>)}
      </div>
      <button type="button" onClick={() => setAdv((x) => !x)} className="mt-3 text-xs text-accent underline">{adv ? "▲ إخفاء" : "▼ دقّة أعلى: نسبة الدهون أو القياسات"}</button>
      {adv && (
        <div className="mt-2 space-y-2 rounded-2xl bg-background/50 p-3 text-xs">
          <label className="block">نسبة الدهون % (إذا بتعرفها)<input inputMode="decimal" value={f.bf} onChange={set("bf")} className={inp} placeholder="مثال: 18" /></label>
          <p className="text-muted">أو قياسات الجسم (سم) لتقدير نسبة الدهون بطريقة البحرية الأمريكية:</p>
          <div className="grid grid-cols-3 gap-2">
            <label>الرقبة<input inputMode="decimal" value={f.neck} onChange={set("neck")} className={inp} /></label>
            <label>الخصر (عند السرّة)<input inputMode="decimal" value={f.waist} onChange={set("waist")} className={inp} /></label>
            {sex === "f" && <label>الورك<input inputMode="decimal" value={f.hip} onChange={set("hip")} className={inp} /></label>}
          </div>
        </div>
      )}

      <div className="mt-4" aria-live="polite">
        {!r.ok ? <p className="rounded-xl bg-red-500/10 p-3 text-center text-xs text-red-200 ring-1 ring-red-400/30">{r.error}</p> : (
          <>
            <div className="rounded-2xl bg-accent p-4 text-center text-accent-foreground">
              <p className="text-xs font-bold opacity-80">سعراتك اليومية — {GOALS[goal].label}</p>
              <p className="text-4xl font-black">{r.target.toLocaleString("en")} <span className="text-base">سعرة</span></p>
              <p className="text-[11px] opacity-80">الصيانة: {r.tdee.toLocaleString("en")} · الحرق الأساسي: {r.bmr.toLocaleString("en")}</p>
            </div>
            {r.clamped && <p className="mt-2 rounded-xl bg-amber-500/10 p-2 text-[11px] text-amber-200 ring-1 ring-amber-400/30">رفعنا الرقم لحد أدنى آمن، العجز الكبير مش مناسب بدون إشراف مختص.</p>}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat k="بروتين" v={`${r.protein}g`} /><Stat k="كارب" v={`${r.carbs}g`} /><Stat k="دهون" v={`${r.fat}g`} />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Stat k="الكتلة الخالية FFM" v={`${r.ffm} كغ`} /><Stat k="كتلة الدهون" v={`${r.fm} كغ`} sub={`${r.bf}% ${r.bfSource === "manual" ? "(مدخلة)" : r.bfSource === "navy" ? "(قياسات)" : "(تقدير BMI)"}`} /><Stat k="FFMI" v={`${r.ffmi}`} sub={`BMI ${r.bmi}`} />
            </div>
            <p className="mt-2 text-center text-xs">💧 مي: حوالي <b>{r.waterL}</b> لتر باليوم</p>
            <ul className="mt-3 space-y-1 text-xs">
              {r.meals.map((m) => <li key={m.key} className="flex justify-between rounded-lg bg-background/50 px-3 py-1.5"><span>{m.label}</span><span className="text-muted">{m.kcal} سعرة · {m.protein}g بروتين</span></li>)}
            </ul>
            <p className="mt-3 text-[10px] leading-relaxed text-muted">تقدير تقريبي وليس نصيحة طبية. الحرق الأساسي بطريقة {r.bmrMethod === "katch" ? "Katch-McArdle (على FFM)" : "Mifflin-St Jeor"}. اعمل متابعة كل 2-3 أسابيع وعدّل حسب نتيجتك.</p>
          </>
        )}
      </div>
    </div>
  );
}
