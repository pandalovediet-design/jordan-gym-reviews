import type { Enums } from "@/lib/database.types";

export const ORG_TYPE_LABEL: Record<Enums<"org_type">, string> = {
  gym: "نادي رياضي",
  independent_coach: "مدرب مستقل",
  sports_facility: "منشأة رياضية",
  store: "متجر رياضي",
  nutritionist: "أخصائي تغذية",
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
  out_of_stock: "غير متوفر",
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
  q.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);

export function publicMediaUrl(path: string) {
  // Demo images ship with the app (public/demo) instead of living in Storage.
  const file = path.split("/").pop() ?? "";
  if (file.startsWith("demo-")) return `/demo/${file}`;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/org-media/${path}`;
}
