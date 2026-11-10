import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/Form";
import { field } from "@/lib/form-styles";
import { requestAddPlace } from "./actions";

export const metadata: Metadata = {
  title: "أضف ناديك إلى GymJo مجاناً",
  description: "عندك نادي أو مسبح أو ملعب أو متجر مكمّلات في الأردن؟ أنشئ حسابك وأدِر صفحتك بنفسك، أو ابعتلنا اسمه ورقمك ونضيفه للدليل مجاناً.",
  alternates: { canonical: "/join" },
};

const KINDS = ["نادي رياضي", "نادي نسائي", "مسبح", "فنون قتالية", "كروس فت / ستوديو", "ملعب أو منشأة", "متجر مكمّلات", "مدرب أو أخصائي تغذية", "غير ذلك"];
const STEPS = [
  ["👤", "أنشئ حسابك", "بالإيميل وكلمة سر، دقيقة وحدة."],
  ["✏️", "عبّي صفحتك", "الأسعار، الدوام، الصور، الموقع، العروض وزر واتساب."],
  ["✅", "بنراجع وبننشر", "بنتأكد من البيانات، وبعدها بتظهر صفحتك بالدليل وعلى غوغل."],
];
const SIGNUP = "/login?mode=signup&next=%2Fdashboard%2Fnew";

export default function Join() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">أضف ناديك إلى <span className="text-accent">GymJo</span></h1>
      <p className="mt-3 text-lg text-muted">الناس بتدور على نادي أو مسبح أو ملعب قريب منها. خلّيهم يلاقوك.</p>
      <p className="mt-4 rounded-xl bg-accent/15 px-4 py-3 font-bold text-accent ring-1 ring-accent/40">الإضافة مجانية. صفحتك بإيدك: لوحة تحكم بتعدّل منها بياناتك وبتشوف مين زارك.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={SIGNUP} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 font-extrabold text-accent-foreground transition hover:brightness-110">أنشئ حساب وسجّل ناديك</Link>
        <Link href="/login?next=%2Fdashboard" className="inline-flex min-h-12 items-center justify-center rounded-xl px-6 font-bold ring-1 ring-white/15 transition hover:ring-accent/60">عندي حساب</Link>
      </div>

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
        <h2 className="text-xl font-bold">ما عندك وقت؟ خلّيها علينا</h2>
        <p className="mb-3 mt-1 text-sm leading-6 text-muted">ابعت اسم المكان ورقمك، وإحنا بنجهّز الصفحة وبنسلّمك إياها بعدين.</p>
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

      <p className="mt-6 text-sm text-muted">مكانك موجود أصلاً بالدليل؟ افتح صفحته واضغط «استلم صفحتك» لتصير تديرها إنت. ولو في معلومة غلط، اضغط «🚩 الإبلاغ عن الإعلان».</p>
      <p className="mt-2 text-sm text-muted">بدك تعلن أو ترعى قسم؟ <Link href="/sponsors" className="text-accent underline">صفحة الرعاة</Link>.</p>
    </div>
  );
}
