import { BILLING_LABEL, WEEKDAYS, WOMEN_LABEL, hhmm, jod } from "@/lib/format";
import type { Faq } from "@/lib/jsonld";
import type { Tables } from "@/lib/database.types";

/** Q&A built only from data the organization actually entered: nothing is invented. */
export function orgFaq(a: {
  name: string; city: string; area: string | null; address: string | null; phone: string | null; whatsapp: string | null;
  services: Tables<"organization_services">[]; hours: Tables<"organization_hours">[]; womenAccess: string; womenNote: string | null;
}): Faq[] {
  const out: Faq[] = [];
  const place = [a.address, a.area, a.city].filter(Boolean).join("، ");
  if (place) out.push({ q: `وين موقع ${a.name}؟`, a: `${a.name} موجود في ${place}.` });
  const priced = a.services.filter((s) => s.price_jod != null).slice(0, 5);
  if (priced.length) out.push({ q: `كم أسعار ${a.name}؟`, a: priced.map((s) => `${s.name_ar}: ${jod(s.price_jod)}${s.billing_period ? ` ${BILLING_LABEL[s.billing_period]}` : ""}`).join("، ") + ". الأسعار حسب ما أدخله النشاط وقد تتغير." });
  const open = a.hours.filter((h) => !h.is_closed && h.opens_at && h.closes_at);
  if (open.length) out.push({ q: `شو ساعات دوام ${a.name}؟`, a: open.map((h) => `${WEEKDAYS[h.weekday]} ${hhmm(h.opens_at)}–${hhmm(h.closes_at)}`).join("، ") + "." });
  if (a.womenAccess === "women_only") out.push({ q: `هل ${a.name} خاص بالنساء؟`, a: `نعم، ${a.name} مصنّف ${WOMEN_LABEL.women_only} (خاص بالنساء).` });
  else if (a.womenAccess === "women_hours") out.push({ q: `هل في أوقات نسائية في ${a.name}؟`, a: `نعم${a.womenNote ? `: ${a.womenNote}` : ""}.` });
  const contact = [a.whatsapp ? "واتساب" : null, a.phone ? `الهاتف ${a.phone}` : null].filter(Boolean);
  if (contact.length) out.push({ q: `كيف أتواصل مع ${a.name}؟`, a: `تقدر تتواصل معهم عبر ${contact.join(" أو ")} من صفحتهم على Jordan Gym Reviews.` });
  return out;
}
