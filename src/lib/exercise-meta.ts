export const MUSCLES = ["chest", "shoulders", "biceps", "triceps", "forearms", "abs", "back", "glutes", "quads", "hamstrings", "calves"] as const;
export type Muscle = (typeof MUSCLES)[number];
export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: "الصدر", shoulders: "الأكتاف", biceps: "البايسبس", triceps: "الترايسبس", forearms: "السواعد", abs: "البطن",
  back: "الظهر", glutes: "المؤخرة", quads: "الفخذ الأمامي", hamstrings: "الفخذ الخلفي", calves: "السمانة",
};
export const isMuscle = (v: string): v is Muscle => (MUSCLES as readonly string[]).includes(v);
export const LEVEL_LABEL: Record<string, string> = { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" };
export const demoCover = (i: number) => `/demo/demo-gym-${(i % 3) + 1}.webp`;
export const SAFETY_NOTE = "المعلومات للتوعية فقط وليست بديلاً عن مدرب مؤهل أو طبيب. ابدأ بوزن خفيف وتوقف إذا حسّيت بألم حاد.";
