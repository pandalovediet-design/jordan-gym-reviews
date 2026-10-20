"use client";
import { useState } from "react";

const ACT = [["1.2", "قليل الحركة"], ["1.375", "تمرين خفيف (1-3 أيام)"], ["1.55", "تمرين متوسط (3-5 أيام)"], ["1.725", "تمرين مكثف (6-7 أيام)"]] as const;
const GOAL = [["-500", "تنزيل وزن"], ["0", "تثبيت"], ["300", "زيادة عضل"]] as const;

export function Calculator() {
  const [sex, setSex] = useState("m");
  const [age, setAge] = useState("25");
  const [h, setH] = useState("170");
  const [w, setW] = useState("70");
  const [act, setAct] = useState("1.375");
  const [goal, setGoal] = useState("0");
  const nums = [Number(age), Number(h), Number(w)];
  const valid = nums.every((n) => n > 0) && nums[0] < 100 && nums[1] < 250 && nums[2] < 300;
  const bmr = valid ? 10 * nums[2] + 6.25 * nums[1] - 5 * nums[0] + (sex === "m" ? 5 : -161) : 0;
  const tdee = bmr * Number(act);
  const target = Math.max(1200, Math.round(tdee + Number(goal)));
  const protein = Math.round(nums[2] * (goal === "300" ? 2 : goal === "-500" ? 1.8 : 1.6));
  const fat = Math.round((target * 0.25) / 9);
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
  const inp = "w-full rounded-xl bg-background px-3 py-2.5 ring-1 ring-white/10 outline-none focus:ring-accent";
  const lbl = "block space-y-1 text-sm text-muted";
  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-2xl bg-surface p-5 ring-1 ring-white/10 sm:grid-cols-2">
        <label className={lbl}>الجنس<select value={sex} onChange={(e) => setSex(e.target.value)} className={inp}><option value="m">ذكر</option><option value="f">أنثى</option></select></label>
        <label className={lbl}>العمر<input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" dir="ltr" className={inp} /></label>
        <label className={lbl}>الطول (سم)<input value={h} onChange={(e) => setH(e.target.value)} inputMode="numeric" dir="ltr" className={inp} /></label>
        <label className={lbl}>الوزن (كغ)<input value={w} onChange={(e) => setW(e.target.value)} inputMode="decimal" dir="ltr" className={inp} /></label>
        <label className={lbl}>النشاط<select value={act} onChange={(e) => setAct(e.target.value)} className={inp}>{ACT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className={lbl}>الهدف<select value={goal} onChange={(e) => setGoal(e.target.value)} className={inp}>{GOAL.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      </div>
      {valid ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["سعرات اليوم", target, "kcal"], ["بروتين", protein, "غ"], ["كارب", carbs, "غ"], ["دهون", fat, "غ"]].map(([k, v, u]) => (
            <div key={k as string} className="rounded-2xl bg-surface p-4 text-center ring-1 ring-white/10"><p className="text-xs text-muted">{k}</p><p className="text-2xl font-extrabold text-accent">{v}</p><p className="text-xs text-muted">{u}</p></div>
          ))}
        </div>
      ) : <p className="text-sm text-red-300">تأكد من الأرقام المدخلة.</p>}
      <p className="text-xs text-muted">تقدير تقريبي (معادلة Mifflin-St Jeor) وليس نصيحة طبية. للحالات الخاصة راجع أخصائي تغذية.</p>
    </div>
  );
}
