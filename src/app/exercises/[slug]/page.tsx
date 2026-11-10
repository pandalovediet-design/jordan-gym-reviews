import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExercise } from "@/lib/exercises";
import { FaqSection, JsonLd, faqLd, type Faq } from "@/lib/jsonld";
import { baseUrl } from "@/lib/base-url";
import { parseVideoUrl } from "@/lib/video";
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
  const muscle = MUSCLE_LABEL[ex.muscle_group as Muscle];
  const first = explanations[0];
  const faq: Faq[] = [
    { q: `شو العضلة اللي بيشتغلها تمرين ${ex.name_ar}؟`, a: `بيشتغل ${muscle}${ex.secondary_ar && ex.secondary_ar !== "—" ? `، ومعه عضلات مساندة: ${ex.secondary_ar}` : ""}.` },
    ...(first ? [{ q: `كيف أعمل تمرين ${ex.name_ar}؟`, a: `${first.steps.map((s, i) => `${i + 1}) ${s}`).join(" ")} (شرح الكابتن ${first.coach.name})` }] : []),
    ...(first?.mistake ? [{ q: `شو أشهر خطأ بتمرين ${ex.name_ar}؟`, a: first.mistake }] : []),
    ...(ex.gear_ar ? [{ q: `شو المعدات المطلوبة لتمرين ${ex.name_ar}؟`, a: ex.gear_ar }] : []),
    { q: `هل ${ex.name_ar} مناسب للمبتدئين؟`, a: `مستواه: ${LEVEL_LABEL[ex.level]}. ${SAFETY_NOTE}` },
  ];
  const url = `${baseUrl()}/exercises/${ex.slug}`;
  const howTo = first ? {
    "@context": "https://schema.org", "@type": "HowTo", name: `كيف تعمل تمرين ${ex.name_ar}`, inLanguage: "ar", url,
    description: ex.summary_ar ?? undefined,
    step: first.steps.map((t, i) => ({ "@type": "HowToStep", position: i + 1, text: t })),
  } : null;
  const videos = explanations.flatMap((e) => {
    const v = e.video_url ? parseVideoUrl(e.video_url) : null;
    return v ? [{ "@context": "https://schema.org", "@type": "VideoObject", name: `شرح ${ex.name_ar} — ${e.coach.name}`, description: ex.summary_ar ?? `شرح تمرين ${ex.name_ar}`, inLanguage: "ar", thumbnailUrl: v.thumb ?? undefined, embedUrl: v.embed?.replace("autoplay=1&", "") ?? undefined, contentUrl: v.url }] : [];
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {howTo && <JsonLd data={howTo} />}
      {videos.map((v, i) => <JsonLd key={i} data={v} />)}
      <JsonLd data={faqLd(faq)} />
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
            <p className="mt-1 text-sm text-muted">إذا إنت مدرب مستقل وبدك تضيف شرحك، تواصل معنا وبيظهر هون بعد المراجعة.</p>
            <Link href="/join" className="mt-4 inline-block rounded-xl bg-accent px-5 py-2 text-sm font-bold text-accent-foreground">تواصل معنا</Link>
          </div>
        )}
      </div>
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">تمارين ثانية لـ{MUSCLE_LABEL[ex.muscle_group as Muscle]}</h2>
          <div className="flex flex-wrap gap-2">{related.map((r) => <Link key={r.slug} href={`/exercises/${r.slug}`} className="rounded-full bg-surface px-4 py-1.5 text-sm ring-1 ring-white/10 hover:ring-accent">{r.name_ar}</Link>)}</div>
        </section>
      )}
      <FaqSection items={faq} title={`أسئلة شائعة عن ${ex.name_ar}`} />
      <p className="mt-10 text-xs text-muted">⚠️ {SAFETY_NOTE}</p>
    </div>
  );
}
