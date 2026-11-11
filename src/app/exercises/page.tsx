import type { Metadata } from "next";
import Link from "next/link";
import { listExercises } from "@/lib/exercises";
import { JsonLd } from "@/lib/jsonld";
import { baseUrl } from "@/lib/base-url";
import { ExerciseExplorer } from "@/components/ExerciseExplorer";
import { PageHead } from "@/components/PageHead";

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
      <PageHead title="مكتبة التمارين" note="اضغط على العضلة اللي بدك تشتغل عليها، وشوف شرح التمرين من مدربين أردنيين." />
      <ExerciseExplorer items={items} />
      <p className="mt-10 rounded-2xl bg-surface p-4 text-sm text-muted ring-1 ring-white/10">
        مدرب مستقل وبدك تضيف شرحك للتمارين؟ <Link href="/join" className="text-accent underline">ابعتلنا</Link> وبنتواصل معك، وبيظهر اسمك وزر واتساب عند كل شرح بعد المراجعة.
      </p>
    </div>
  );
}
