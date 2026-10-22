import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExercise } from "@/lib/exercises";
import { ExplanationTabs } from "@/components/ExplanationTabs";
import { LEVEL_LABEL, MUSCLE_LABEL, SAFETY_NOTE, type Muscle } from "@/lib/exercise-meta";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/exercises/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = await getExercise(slug);
  if (!d) return { title: "تمرين غير موجود", robots: { index: false } };
  return {
    title: `شرح تمرين ${d.ex.name_ar} — ${MUSCLE_LABEL[d.ex.muscle_group as Muscle]}`,
    description: d.ex.summary_ar ?? `شرح ${d.ex.name_ar} بالخطوات والأخطاء الشائعة من مدربين أردنيين.`,
    alternates: { canonical: `/exercises/${d.ex.slug}` },
  };
}

export default async function ExercisePage({ params }: PageProps<"/exercises/[slug]">) {
  const { slug } = await params;
  const d = await getExercise(slug);
  if (!d) notFound();
  const { ex, explanations, related } = d;
  const chip = "rounded-full bg-white/10 px-3 py-1 text-xs";
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/exercises" className="text-sm text-accent hover:underline">← كل التمارين</Link>
      <h1 className="mt-3 text-3xl font-extrabold">{ex.name_ar}</h1>
      {ex.summary_ar && <p className="mt-2 text-muted">{ex.summary_ar}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`${chip} !bg-accent !text-accent-foreground`}>{MUSCLE_LABEL[ex.muscle_group as Muscle]}</span>
        <span className={chip}>{LEVEL_LABEL[ex.level]}</span>
        {ex.gear_ar && <span className={chip}>🏋️ {ex.gear_ar}</span>}
        {ex.secondary_ar && ex.secondary_ar !== "—" && <span className={chip}>عضلات مساندة: {ex.secondary_ar}</span>}
      </div>
      <div className="mt-8">
        {explanations.length > 0 ? <ExplanationTabs items={explanations} exName={ex.name_ar} /> : (
          <div className="rounded-2xl bg-surface p-6 text-center ring-1 ring-white/10">
            <p className="font-bold">لسا ما في شرح لهالتمرين</p>
            <p className="mt-1 text-sm text-muted">إذا إنت مدرب مستقل، سجّل نشاطك وأضف شرحك وبيظهر هون بعد موافقة الإدارة.</p>
            <Link href="/join" className="mt-4 inline-block rounded-xl bg-accent px-5 py-2 text-sm font-bold text-accent-foreground">سجّل كمدرب</Link>
          </div>
        )}
      </div>
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">تمارين ثانية لـ{MUSCLE_LABEL[ex.muscle_group as Muscle]}</h2>
          <div className="flex flex-wrap gap-2">{related.map((r) => <Link key={r.slug} href={`/exercises/${r.slug}`} className="rounded-full bg-surface px-4 py-1.5 text-sm ring-1 ring-white/10 hover:ring-accent">{r.name_ar}</Link>)}</div>
        </section>
      )}
      <p className="mt-10 text-xs text-muted">⚠️ {SAFETY_NOTE}</p>
    </div>
  );
}
