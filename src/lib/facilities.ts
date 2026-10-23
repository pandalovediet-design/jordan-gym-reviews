// Owner-declared facility options ("حسب صاحب النشاط"). Keys must match the DB check constraint on organizations.accessibility.
export const ACCESS_OPTIONS = [
  { key: "ramp", label: "مدخل بدون درج أو رامب" },
  { key: "elevator", label: "مصعد" },
  { key: "wide_doors", label: "أبواب واسعة" },
  { key: "accessible_toilet", label: "حمّام مهيّأ" },
  { key: "parking", label: "موقف مخصص" },
  { key: "quiet_hours", label: "ساعات هادئة (للتوحد والحساسية للصوت)" },
  { key: "sign_language", label: "لغة إشارة" },
  { key: "adaptive_coach", label: "مدرب بخبرة بالتدريب المكيّف" },
] as const;
export const ACCESS_KEYS: readonly string[] = ACCESS_OPTIONS.map((o) => o.key);
export const accessLabel = (k: string) => ACCESS_OPTIONS.find((o) => o.key === k)?.label ?? k;
