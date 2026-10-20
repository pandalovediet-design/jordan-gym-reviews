import type { Enums } from "@/lib/database.types";

export const ORG_TYPE_LABEL: Record<Enums<"org_type">, string> = {
  gym: "نادي رياضي",
  independent_coach: "مدرب مستقل",
  sports_facility: "منشأة رياضية",
  store: "متجر رياضي",
  nutritionist: "أخصائي تغذية",
  healthy_food: "أكل صحي",
  sports_health: "علاج وطب رياضي",
};

export const BILLING_LABEL: Record<Enums<"billing_period">, string> = {
  session: "للحصة",
  day: "لليوم",
  week: "للأسبوع",
  month: "شهرياً",
  quarter: "كل 3 أشهر",
  year: "سنوياً",
};

export const AVAILABILITY_LABEL: Record<Enums<"availability_status">, string> = {
  available: "متوفر",
  limited: "كمية محدودة",
  out_of_stock: "خلص — غير متاح حالياً",
  unknown: "غير معروف",
};

export const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export const jod = (n: number | null | undefined) =>
  n == null ? "—" : `${Number(n).toFixed(2)} د.أ`;

export const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

export const dateAr = (iso: string) =>
  new Intl.DateTimeFormat("ar-JO", { dateStyle: "medium" }).format(new Date(iso));

/** Normalise a Jordanian number to wa.me format (digits only, 962 prefix). */
export function waNumber(raw: string | null): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "962" + d.slice(1);
  return d.length >= 9 ? d : null;
}

/** Keep user text safe inside a PostgREST .or() filter. */
export const cleanQuery = (q: string) =>
  q.replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);

export function publicMediaUrl(path: string) {
  // Demo images ship with the app (public/demo) instead of living in Storage.
  const file = path.split("/").pop() ?? "";
  if (file.startsWith("demo-")) return `/demo/${file}`;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/org-media/${path}`;
}

export const ORG_TYPE_PLURAL: Record<Enums<"org_type">, string> = {
  gym: "نوادي رياضية",
  independent_coach: "مدربون مستقلون",
  sports_facility: "منشآت رياضية",
  store: "متاجر رياضية",
  nutritionist: "أخصائيو تغذية",
  healthy_food: "أكل صحي",
  sports_health: "عيادات وعلاج رياضي",
};

/** Normalize a Jordanian/international phone to +<digits> (07xxxxxxxx -> +9627xxxxxxxx). */
export function toIntl(v: string | null | undefined) {
  if (!v) return null;
  let d = v.replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = "+" + d.slice(2);
  if (d.startsWith("0")) d = "+962" + d.slice(1);
  if (/^962/.test(d)) d = "+" + d;
  return d;
}

export const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const isoDaysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();
export const msAgo = (days: number) => Date.now() - days * 86_400_000;

export const WOMEN_LABEL = { women_only: "Pink Zone", women_hours: "أوقات نسائية" } as const;

export const GLOW_COLORS = ["gold", "blue", "green", "pink"] as const;
export type GlowColor = (typeof GLOW_COLORS)[number];
export const GLOW_LABEL: Record<GlowColor, string> = { gold: "⭐ عضو ذهبي", blue: "💎 عضو أزرق", green: "🌿 عضو أخضر", pink: "💗 عضو زهري" };
export const GLOW_NAME: Record<GlowColor, string> = { gold: "ذهبي", blue: "أزرق", green: "أخضر", pink: "زهري" };
export const asGlow = (v: string | null | undefined): GlowColor | null => ((GLOW_COLORS as readonly string[]).includes(v ?? "") ? (v as GlowColor) : null);

export const DELIVERY_LABEL = { own_delivery: "توصيل خاص", apps: "عبر تطبيقات التوصيل", pickup: "استلام من المكان" } as const;
export const TRAIL_DIFFICULTY = { easy: "سهل", moderate: "متوسط", hard: "صعب", expert: "للخبراء" } as const;
export const TRAIL_TYPE = { hiking: "هايكنق", walking: "مشي", running: "ركض" } as const;

/** The verified badge is active unless it has an expiry date in the past. */
export const isVerified = (o: { verified_at: string | null; verified_until?: string | null }) =>
  !!o.verified_at && (!o.verified_until || +new Date(o.verified_until) > Date.now());
export const REPORT_REASON = { wrong_info: "معلومات خاطئة", fake: "نشاط وهمي", inappropriate: "محتوى غير لائق", closed: "النشاط مغلق", other: "سبب آخر" } as const;
