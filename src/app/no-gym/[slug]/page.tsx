/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHomeWorkout } from "@/lib/home-workouts";
import { equipIcon, equipLabel, focusLabel } from "@/lib/home-meta";
import { FaqSection, JsonLd, faqLd, type Faq } from "@/lib/jsonld";
import { baseUrl } from "@/lib/base-url";
import { parseVideoUrl } from "@/lib/video";
import { HomePlayer } from "@/components/HomePlayer";
import { LEVEL_LABEL, SAFETY_NOTE } from "@/lib/exercise-meta";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/no-gym/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const w = await getHomeWorkout(slug);
  if (!w) return { title: "تمرين غير موجود", robots: { index: false } };
  return {
    title: `${w.title} — تمرين منزلي (${equipLabel(w.equipment)})`,
    description: w.summary ?? `شرح ${w.title} بالفيديو والخطوات، تمرين منزلي بـ${equipLabel(w.equipment)} لعضلة ${focusLabel(w.focus)}.`,
    alternates: { canonical: `/no-gym/${w.slug}` },
  };
}

export default async function HomeWorkoutPage({ params }: PageProps<"/no-gym/[slug]">) {
  const { slug } = await params;
  const w = await getHomeWorkout(slug);
  if (!w) notFound();
  const chip = "rounded-full bg-white/10 px-3 py-1 text-xs";
  const url = `${baseUrl()}/no-gym/${w.slug}`;
  const v = parseVideoUrl(w.video_url);
  const faq: Faq[] = [
    { q: `كيف أعمل تمرين ${w.title} بالبيت؟`, a: w.steps.map((s, i) => `${i + 1}) ${s}`).join(" ") },
    { q: `شو الأدوات المطلوبة لتمرين ${w.title}؟`, a: w.equipment === "none" ? "ما بتحتاج أي أدوات، جسمك يكفي." : `الأداة: ${equipLabel(w.equipment)}.${w.products.length ? ` ممكن تلاقيها بالروابط تحت الفيديو: ${w.products.map((p) => p.name).join("، ")}.` : ""}` },
    { q: `أي عضلة بيشتغل ${w.title}؟`, a: `بيشتغل ${focusLabel(w.focus)}. مستواه: ${LEVEL_LABEL[w.level]}${w.sets ? `، والعدّات المقترحة: ${w.sets}` : ""}.` },
    ...(w.mistake ? [{ q: `شو أشهر خطأ بتمرين ${w.title}؟`, a: w.mistake }] : []),
    { q: "هل التمرين مناسب للمبتدئين؟", a: SAFETY_NOTE },
  ];
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "HowTo", name: `كيف تعمل تمرين ${w.title}`, inLanguage: "ar", url, description: w.summary ?? undefined,
        tool: w.equipment === "none" ? undefined : [{ "@type": "HowToTool", name: equipLabel(w.equipment) }],
        step: w.steps.map((t, i) => ({ "@type": "HowToStep", position: i + 1, text: t })) }} />
      {v && <JsonLd data={{ "@context": "https://schema.org", "@type": "VideoObject", name: w.title, description: w.summary ?? `تمرين منزلي: ${w.title}`, inLanguage: "ar", thumbnailUrl: w.cover ?? undefined, embedUrl: v.embed?.replace("autoplay=1&", "") ?? undefined, contentUrl: v.url }} />}
      <JsonLd data={faqLd(faq)} />
      <Link href="/no-gym" className="text-sm text-accent hover:underline">← من غير جيم</Link>
      <div className="mt-4 grid gap-8 md:grid-cols-[300px_1fr]">
        <div className="mx-auto w-full max-w-[300px] md:sticky md:top-6 md:self-start">
          <HomePlayer url={w.video_url} title={w.title} cover={w.cover} equipment={w.equipment} />
        </div>
        <div>
          <h1 className="text-3xl font-black md:text-4xl">{w.title}</h1>
          {w.summary && <p className="mt-2 text-muted">{w.summary}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`${chip} !bg-accent font-bold !text-accent-foreground`}>{equipIcon(w.equipment)} {equipLabel(w.equipment)}</span>
            <span className={chip}>{focusLabel(w.focus)}</span>
            <span className={chip}>{LEVEL_LABEL[w.level]}</span>
            {w.sets && <span className={chip}>🔁 {w.sets}</span>}
          </div>

          <h2 className="mb-3 mt-8 text-lg font-bold">الخطوات</h2>
          <ol className="space-y-2">
            {w.steps.map((s, k) => (
              <li key={k} className="flex gap-3 rounded-xl bg-surface p-3 text-sm ring-1 ring-white/10"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{k + 1}</span><span>{s}</span></li>
            ))}
          </ol>
          {w.mistake && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-400/30">⚠️ <b>خطأ شائع:</b> {w.mistake}</p>}

          {w.products.length > 0 && (
            <section className="mt-10 rounded-3xl bg-surface p-5 ring-1 ring-white/10">
              <h2 className="text-lg font-bold">🛒 المنتج اللي بتمرّن فيه</h2>
              <p className="text-sm text-muted">الأدوات المستخدمة بهالتمرين، لو حبيت تجيبها.</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {w.products.map((p) => (
                  <li key={p.id} className="flex flex-col overflow-hidden rounded-2xl bg-background ring-1 ring-white/10">
                    <div className="aspect-[4/3] bg-black/40">
                      {p.image ? <img src={p.image} alt={p.name} loading="lazy" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-5xl opacity-50">{equipIcon(w.equipment)}</div>}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <p className="font-bold leading-snug">{p.name}</p>
                      <p className="text-xs text-muted">{[p.store, p.price].filter(Boolean).join(" · ")}</p>
                      <a href={`/go/${p.id}`} target="_blank" rel="sponsored nofollow noopener noreferrer" className="mt-auto rounded-xl bg-accent px-4 py-2 text-center text-sm font-bold text-accent-foreground transition hover:brightness-110">اشتريه ↗</a>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-muted">روابط الشراء قد تعطينا عمولة بدون أي تكلفة إضافية عليك، وهاد بيساعدنا نكمّل المحتوى المجاني.</p>
            </section>
          )}

          <Link href="/directory" className="mt-8 block rounded-2xl bg-accent p-5 text-accent-foreground transition hover:brightness-110">
            <p className="text-lg font-extrabold">جاهز تجرّب النادي؟</p>
            <p className="text-sm opacity-80">شوف النوادي والكباتن القريبين منك ←</p>
          </Link>
        </div>
      </div>

      {w.related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">تمارين منزلية ثانية</h2>
          <div className="flex flex-wrap gap-2">{w.related.map((r) => <Link key={r.slug} href={`/no-gym/${r.slug}`} className="rounded-full bg-surface px-4 py-1.5 text-sm ring-1 ring-white/10 hover:ring-accent">{r.title}</Link>)}</div>
        </section>
      )}
      <FaqSection items={faq} title={`أسئلة شائعة عن ${w.title}`} />
      <p className="mt-10 text-xs text-muted">⚠️ {SAFETY_NOTE}</p>
    </div>
  );
}
