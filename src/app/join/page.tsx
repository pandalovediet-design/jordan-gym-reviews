import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "سجّل نشاطك الرياضي مجاناً",
  description: "صفحة مجانية لناديك أو متجرك أو عيادتك أو كمدرب: أسعار، دوام، صور، موقع، وتواصل واتساب مباشر، مع أدوات لإدارة الأعضاء.",
  alternates: { canonical: "/join" },
};

const WHO = ["🏋️ نوادي رياضية", "🧑‍🏫 مدربون مستقلون", "⚽ ملاعب ومنشآت", "🛒 متاجر رياضية", "🥗 أخصائيو تغذية", "🍱 أكل صحي", "🩺 علاج رياضي"];
const GET = [
  ["📍", "صفحة كاملة", "أسعار، دوام، صور، موقع على الخريطة، وزر واتساب. تظهر على غوغل وعلى موقعنا."],
  ["💬", "استفسارات مباشرة", "الزائر بيراسلك واتساب أو بالنموذج، وبتشوف كل الاستفسارات بلوحتك."],
  ["👥", "إدارة الأعضاء", "اشتراكات، حضور بـQR، برامج تمرين وتغذية، وصفحة خاصة لكل عضو."],
  ["📊", "أرقام حقيقية", "كم شاف صفحتك وكم ضغط واتساب، عشان تعرف شو شغّال."],
  ["💗", "Pink Zone", "لو مكانك نسائي أو فيه أوقات نسائية، بتظهر بصفحة مخصصة."],
  ["⭐", "ظهور أكبر (لاحقاً)", "شارة التوثيق، التمييز بالقوائم، العروض السريعة، والتوهج الملوّن."],
];

export default function Join() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">سجّل نشاطك على <span className="text-accent">Jordan Gym Reviews</span></h1>
      <p className="mt-3 text-lg text-muted">دليل الرياضة في الأردن. الناس بتدور على نادي أو مدرب أو متجر، خلّيهم يلاقوك.</p>
      <p className="mt-4 rounded-xl bg-accent/15 px-4 py-3 font-bold text-accent ring-1 ring-accent/40">التسجيل وإنشاء الصفحة مجاناً حالياً.</p>
      <div className="mt-8 flex flex-wrap gap-2 text-sm">{WHO.map((w) => <span key={w} className="rounded-full bg-surface px-4 py-1.5 ring-1 ring-white/10">{w}</span>)}</div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">{GET.map(([i, t, d]) => (
        <li key={t} className="rounded-2xl bg-surface p-5 ring-1 ring-white/10"><p className="text-2xl">{i}</p><h2 className="mt-1 font-bold">{t}</h2><p className="mt-1 text-sm leading-6 text-muted">{d}</p></li>))}</ul>
      <section className="mt-10">
        <h2 className="text-xl font-bold">كيف تبدأ؟</h2>
        <ol className="mt-3 list-decimal space-y-2 pe-5 ps-0 text-muted marker:text-accent">
          <li>أنشئ حساب بالإيميل وكلمة سر.</li>
          <li>اختار نوع نشاطك وعبّي البيانات الأساسية وأضف صورة.</li>
          <li>أضف الأسعار والدوام، وبعدها اضغط «إرسال للمراجعة». الإدارة بتنشر صفحتك.</li>
        </ol>
      </section>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/login?mode=signup" className="rounded-xl bg-accent px-8 py-3 font-bold text-accent-foreground">أنشئ حسابك مجاناً</Link>
        <Link href="/login" className="rounded-xl bg-surface px-8 py-3 ring-1 ring-white/10">عندي حساب</Link>
      </div>
    </div>
  );
}
