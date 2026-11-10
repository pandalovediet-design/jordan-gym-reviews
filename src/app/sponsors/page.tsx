import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { ActionForm } from "@/components/Form";
import { field } from "@/lib/form-styles";
import { submitSponsorLead } from "./actions";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "ملف الرعاة — أعلن مع GYMJO",
  description: "وصّل علامتك لمحبي الرياضة في الأردن: أرقام المنصة الحية وأماكن الإعلان والرعاية.",
  alternates: { canonical: "/sponsors" },
};

const PACKAGES = [
  ["راعي الشهر", "شعارك وروابطك بأعلى الصفحة الرئيسية وصفحات الدليل لمدة شهر، مع شارة «برعاية»."],
  ["راعي قسم", "رعاية حصرية لقسم كامل (Pink Zone، الملاعب، المتاجر...) باسمك."],
  ["عروض فلاش", "عرضك يظهر بمقدمة الصفحة بوقت محدد مع عدّاد."],
  ["أكواد خصم حصرية", "كود خاص بزوار المنصة بصفحة «أكواد خصم» وبصفحتك، ونعطيك عدد مرات ظهور الكود."],
  ["نشاط مميز", "ظهور أعلى بنتائج البحث والدليل مع إطار مميز."],
  ["ترويج بسوق المعدات", "إعلانك بين إعلانات بيع وتبديل المعدات."],
] as const;

export default async function Sponsors() {
  const { data } = await createPublicClient().rpc("get_public_stats");
  const s = data?.[0];
  const n = (v: number | string | null | undefined) => new Intl.NumberFormat("ar-JO-u-nu-latn").format(Number(v ?? 0));
  const stats: [string, string][] = [
    ["نشاط مسجّل", n(s?.orgs)], ["مدينة", n(s?.cities)], ["مشاهدة صفحة (30 يوم)", n(s?.views_30d)],
    ["نقرة واتساب (30 يوم)", n(s?.whatsapp_30d)], ["اتصال (30 يوم)", n(s?.phone_30d)], ["استفسار (30 يوم)", n(s?.inquiries_30d)],
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-3xl font-extrabold">🤝 ملف الرعاة</h1>
        <p className="mt-2 text-muted">GYMJO دليل عربي للأندية والمدربين والملاعب والمتاجر الرياضية بالأردن. جمهورنا ناس بدهم يشتركوا ويشتروا ويتدرّبوا، وإنت بتوصلهم بنفس لحظة القرار.</p>
      </header>
      <section>
        <h2 className="mb-3 text-xl font-bold">أرقام المنصة (حيّة)</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-surface p-4 text-center ring-1 ring-white/10"><p className="text-2xl font-extrabold text-accent">{v}</p><p className="mt-1 text-xs text-muted">{l}</p></div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">الأرقام من تحليلات المنصة نفسها وبتتحدّث تلقائياً. المنصة جديدة، وأرقامنا بتكبر كل أسبوع.</p>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-bold">وين بتظهر؟</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PACKAGES.map(([t, d]) => (<li key={t} className="rounded-2xl bg-surface p-4 ring-1 ring-white/10"><p className="font-bold">{t}</p><p className="mt-1 text-sm text-muted">{d}</p></li>))}
        </ul>
        <p className="mt-2 text-sm text-muted">الأسعار بتتحدد حسب المدة والمكان، وبنتفق عليها معك مباشرة.</p>
      </section>
      <section className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <h2 className="mb-3 text-xl font-bold">اطلب عرض</h2>
        <ActionForm action={submitSponsorLead} submit="إرسال الطلب">
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <input name="name" required placeholder="اسمك" className={field} />
          <input name="company" placeholder="الشركة / العلامة (اختياري)" className={field} />
          <input name="phone" required dir="ltr" inputMode="tel" placeholder="رقم الهاتف / واتساب" className={field} />
          <select name="package" defaultValue="" className={field}>
            <option value="">الباقة اللي تهمك (اختياري)</option>
            {PACKAGES.map(([t]) => <option key={t} value={t}>{t}</option>)}
          </select>
          <textarea name="message" rows={3} maxLength={600} placeholder="شو بدك توصل؟ (اختياري)" className={field} />
        </ActionForm>
      </section>
    </div>
  );
}
