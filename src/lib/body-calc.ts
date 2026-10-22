export type Sex = "m" | "f";
export type Goal = "cut_soft" | "cut" | "maintain" | "bulk";
export const GOALS: Record<Goal, { label: string; pct: number; protein: number }> = {
  cut_soft: { label: "تنشيف هادي", pct: -0.12, protein: 1.9 },
  cut: { label: "تنشيف", pct: -0.2, protein: 2.0 },
  maintain: { label: "ثبات", pct: 0, protein: 1.6 },
  bulk: { label: "تضخيم نظيف", pct: 0.1, protein: 1.8 },
};
export const ACTIVITY = [
  { v: 1.2, label: "قليل الحركة (شغل مكتب)" },
  { v: 1.375, label: "خفيف (1-3 تمارين بالأسبوع)" },
  { v: 1.55, label: "متوسط (3-5 تمارين)" },
  { v: 1.725, label: "عالي (6-7 تمارين)" },
  { v: 1.9, label: "شديد (شغل بدني + تمرين)" },
] as const;
export const MEAL_SPLIT = [
  { key: "breakfast", label: "فطور", share: 0.25 },
  { key: "lunch", label: "غداء", share: 0.35 },
  { key: "dinner", label: "عشاء", share: 0.25 },
  { key: "snack", label: "سناك / مشروبات", share: 0.15 },
] as const;

export type CalcInput = {
  sex: Sex; age: number; height: number; weight: number; activity: number; goal: Goal;
  bodyFat?: number | null; neck?: number | null; waist?: number | null; hip?: number | null;
};
export type CalcOk = {
  ok: true; bmi: number; bf: number; bfSource: "manual" | "navy" | "bmi"; fm: number; ffm: number; ffmi: number;
  bmr: number; bmrMethod: "katch" | "mifflin"; tdee: number; target: number; clamped: boolean;
  protein: number; carbs: number; fat: number; waterL: number;
  meals: { key: string; label: string; kcal: number; protein: number }[];
};
export type CalcResult = CalcOk | { ok: false; error: string };

const num = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const r1 = (x: number) => Math.round(x * 10) / 10;

export function calc(i: CalcInput): CalcResult {
  const { sex, age, height: h, weight: w } = i;
  if (!(age >= 18 && age <= 80)) return { ok: false, error: "الحاسبة للبالغين من 18 لـ80 سنة." };
  if (!(h >= 120 && h <= 230)) return { ok: false, error: "الطول لازم يكون بين 120 و230 سم." };
  if (!(w >= 30 && w <= 250)) return { ok: false, error: "الوزن لازم يكون بين 30 و250 كغ." };
  const bmi = w / ((h / 100) ** 2);
  let bf: number, bfSource: CalcOk["bfSource"];
  const manual = num(i.bodyFat), neck = num(i.neck), waist = num(i.waist), hip = num(i.hip);
  if (manual !== null) {
    if (!(manual >= 3 && manual <= 60)) return { ok: false, error: "نسبة الدهون لازم تكون بين 3% و60%." };
    bf = manual; bfSource = "manual";
  } else if (neck !== null && waist !== null && (sex === "m" || hip !== null)) {
    if (!(neck >= 20 && neck <= 60) || !(waist >= 40 && waist <= 200) || (sex === "f" && !((hip ?? 0) >= 50 && (hip ?? 0) <= 200))) return { ok: false, error: "راجع القياسات (سم): الرقبة والخصر والورك." };
    const d = sex === "m" ? waist - neck : waist + (hip as number) - neck;
    if (d <= 0) return { ok: false, error: "قياس الخصر لازم يكون أكبر من الرقبة." };
    bf = sex === "m"
      ? 495 / (1.0324 - 0.19077 * Math.log10(d) + 0.15456 * Math.log10(h)) - 450
      : 495 / (1.29579 - 0.35004 * Math.log10(d) + 0.221 * Math.log10(h)) - 450;
    bf = clamp(bf, 3, 60); bfSource = "navy";
  } else {
    bf = clamp(1.2 * bmi + 0.23 * age - 10.8 * (sex === "m" ? 1 : 0) - 5.4, 3, 60); bfSource = "bmi";
  }
  const fm = (w * bf) / 100;
  const ffm = w - fm;
  const ffmi = ffm / ((h / 100) ** 2);
  const mifflin = 10 * w + 6.25 * h - 5 * age + (sex === "m" ? 5 : -161);
  const katch = 370 + 21.6 * ffm;
  const bmrMethod = bfSource === "bmi" ? "mifflin" : "katch";
  const bmr = bmrMethod === "katch" ? katch : mifflin;
  const tdee = bmr * i.activity;
  const g = GOALS[i.goal];
  // Safety: never plan below the BMR or an absolute minimum.
  const floor = Math.max(sex === "m" ? 1500 : 1200, bmr);
  const raw = tdee * (1 + g.pct);
  const clamped = g.pct < 0 && raw < floor;
  const target = Math.round((clamped ? floor : raw) / 10) * 10;
  const protein = Math.round(Math.min(w * g.protein, (target * 0.4) / 4));
  const fat = Math.round(Math.max((target * 0.25) / 9, w * 0.6));
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
  const waterL = r1(w * 0.035 + (i.activity >= 1.55 ? 0.5 : 0));
  return {
    ok: true, bmi: r1(bmi), bf: r1(bf), bfSource, fm: r1(fm), ffm: r1(ffm), ffmi: r1(ffmi),
    bmr: Math.round(bmr), bmrMethod, tdee: Math.round(tdee), target, clamped, protein, carbs, fat, waterL,
    meals: MEAL_SPLIT.map((m) => ({ key: m.key, label: m.label, kcal: Math.round((target * m.share) / 10) * 10, protein: Math.round(protein * m.share) })),
  };
}
