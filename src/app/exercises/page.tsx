import type { Metadata } from "next";
import Link from "next/link";
import { listExercises } from "@/lib/exercises";
import { JsonLd } from "@/lib/jsonld";
import { baseUrl } from "@/lib/base-url";
import { ExerciseExplorer } from "@/components/ExerciseExplorer";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "دليل التمارين بالعربي — شرح من مدربين أردنيين",
  description: "اختار العضلة اللي بدك تشتغل عليها وشوف شرح التمرين بالفيديو والخطوات والأخطاء الشائعة من مدربين بالأردن.",
  alternates: { canonical: "/exercises" },
};

export default async function Exercises() {
  const items = await listExercises();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: "دليل التمارين بالعربي", inLanguage: "ar", itemListElement: items.map((e, i) => ({ "@type": "ListItem", position: i + 1, name: e.name_ar, url: `${baseUrl()}/exercises/${e.slug}` })) }} />
      <h1 className="text-3xl font-extrabold md:text-4xl">دليل التمارين <span className="text-accent">بالعربي</span></h1>
      <p className="mt-2 max-w-xl text-muted">اضغط على العضلة اللي بدك تشتغل عليها، وشوف شرح التمرين من مدربين أردنيين.</p>
      <ExerciseExplorer items={items} />
      <p className="mt-10 rounded-2xl bg-surface p-4 text-sm text-muted ring-1 ring-white/10">
        مدرب مستقل؟ <Link href="/join" className="text-accent underline">سجّل نشاطك</Link> وأضف شرحك للتمارين من لوحة التحكم، وبيظهر اسمك وزر واتساب عند كل شرح بعد موافقة الإدارة.
      </p>
    </div>
  );
}
