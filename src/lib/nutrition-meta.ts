export const MEALS = ["breakfast", "lunch", "dinner", "snack", "drink"] as const;
export type Meal = (typeof MEALS)[number];
export const MEAL_LABEL: Record<Meal, string> = { breakfast: "فطور", lunch: "غداء", dinner: "عشاء", snack: "سناك", drink: "مشروبات" };
export const MEAL_ICON: Record<Meal, string> = { breakfast: "🍳", lunch: "🍛", dinner: "🍽️", snack: "🥜", drink: "🥤" };
export const MEAL_GRADIENT: Record<Meal, string> = {
  breakfast: "from-amber-400/40 via-orange-700/30 to-black",
  lunch: "from-lime-400/35 via-emerald-800/30 to-black",
  dinner: "from-indigo-400/35 via-violet-900/30 to-black",
  snack: "from-rose-400/35 via-red-900/30 to-black",
  drink: "from-sky-400/40 via-cyan-800/30 to-black",
};
export const KIND_LABEL = { video: "فيديو", plan: "خطة" } as const;
export const mealLabel = (m: string) => MEAL_LABEL[m as Meal] ?? m;
export const mealIcon = (m: string) => MEAL_ICON[m as Meal] ?? "🍴";
export const mealGradient = (m: string) => MEAL_GRADIENT[m as Meal] ?? MEAL_GRADIENT.lunch;
export const isMeal = (v: string): v is Meal => (MEALS as readonly string[]).includes(v);
export const NUTRITION_NOTE = "المحتوى للتوعية فقط وليس بديلاً عن أخصائي تغذية أو طبيب. إذا عندك مرض مزمن أو حمل أو عمرك أقل من 18، راجع مختص قبل أي تغيير بأكلك.";
