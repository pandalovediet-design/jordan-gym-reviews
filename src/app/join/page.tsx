import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/Form";
import { field } from "@/lib/form-styles";
import { requestAddPlace } from "./actions";

export const metadata: Metadata = {
  title: "أضف ناديك إلى GymJo مجاناً",
  description: "عندك نادي أو مسبح أو ملعب أو متجر مكمّلات في الأردن؟ ابعتلنا اسمه ورقمك، ونضيفه للدليل مجاناً مع الأسعار والدوام والصور والموقع.",
  alternates: { canonical: "/join" },
};

const KINDS = ["نادي رياضي", "نادي نسائي", "مسبح", "فنون قتالية", "كروس فت / ستوديو", "ملعب أو منشأة", "متجر مكمّلات", "مدرب أو أخصائي تغذية", "غير ذلك"];
const STEPS = [
  ["📝", "ابعت الطلب", "اسم المكان ورقمك، دقيقة وحدة."],
  ["✅", "بنراجع ونجهّز", "بنتأكد من المكان ونعبّي الأسعار والدوام والصور والموقع."],
  ["📍", "صفحتك جاهزة", "بتظهر بالدليل وعلى غوغل، مع زر واتساب مباشر إلك."],
];

export default function Join() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">أضف ناديك إلى <span className="text-accent">GymJo</span></h1>
      <p className="mt-3 text-lg text-muted">الناس بتدور على نادي أو مسبح أو ملعب قريب منها. خلّيهم يلاقوك.</p>
      <p className="mt-4 rounded-xl bg-accent/15 px-4 py-3 font-bold text-accent ring-1 ring-accent/40">الإضافة مجانية، وما في حساب ولا لوحة تحكم: إحنا بنجهّز الصفحة وبنحدّثها معك.</p>

      <ol className="mt-8 grid gap-3 sm:grid-cols-3">
        {STEPS.map(([icon, title, text], i) => (
          <li key={title} className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
            <p className="text-2xl" aria-hidden>{icon}</p>
            <h2 className="mt-1 font-bold">{i + 1}. {title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
          </li>
        ))}
      </ol>

      <section className="mt-8 rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <h2 className="mb-3 text-xl font-bold">اطلب إضافة مكانك</h2>
        <ActionForm action={requestAddPlace} submit="إرسال الطلب">
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <label className="block text-sm font-bold">اسم المكان<input name="place" required maxLength={80} placeholder="مثلاً: نادي القمة" className={`${field} mt-1 block font-normal`} /></label>
          <label className="block text-sm font-bold">نوعه
            <select name="kind" defaultValue="" className={`${field} mt-1 block font-normal`}>
              <option value="">اختر (اختياري)</option>
              {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold">المنطقة<input name="area" maxLength={80} placeholder="مثلاً: عين الباشا، خلدا" className={`${field} mt-1 block font-normal`} /></label>
          <label className="block text-sm font-bold">اسمك<input name="name" required maxLength={80} autoComplete="name" className={`${field} mt-1 block font-normal`} /></label>
          <label className="block text-sm font-bold">رقم واتساب<input name="phone" required dir="ltr" inputMode="tel" autoComplete="tel" placeholder="07xxxxxxxx" className={`${field} mt-1 block font-normal`} /></label>
          <label className="block text-sm font-bold">رابط Google Maps <span className="font-normal text-muted">(اختياري)</span><input name="maps" dir="ltr" inputMode="url" maxLength={300} className={`${field} mt-1 block font-normal`} /></label>
          <label className="block text-sm font-bold">ملاحظة <span className="font-normal text-muted">(اختياري)</span><textarea name="note" rows={3} maxLength={300} placeholder="أوقات نسائية، عروض، أي شي بدك نعرفه" className={`${field} mt-1 block font-normal`} /></label>
        </ActionForm>
      </section>

      <p className="mt-6 text-sm text-muted">مكانك موجود أصلاً وفي معلومة غلط؟ افتح صفحته واضغط «🚩 الإبلاغ عن الإعلان»، أو ابعتلنا من هون واكتب التصحيح بالملاحظة.</p>
      <p className="mt-2 text-sm text-muted">بدك تعلن أو ترعى قسم؟ <Link href="/sponsors" className="text-accent underline">صفحة الرعاة</Link>.</p>
    </div>
  );
}
