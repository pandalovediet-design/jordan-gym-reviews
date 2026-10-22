/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNutrition } from "@/lib/nutrition";
import { mealGradient, mealIcon, mealLabel, NUTRITION_NOTE } from "@/lib/nutrition-meta";
import { JsonLd } from "@/lib/jsonld";
import { parseVideoUrl } from "@/lib/video";
import { HomePlayer } from "@/components/HomePlayer";
import { RichText } from "@/components/RichText";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/no-deprivation/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const w = await getNutrition(slug);
  if (!w) return { title: "غير موجود", robots: { index: false } };
  return {
    title: `${w.title} — ${mealLabel(w.meal)}${w.calories != null ? ` (${w.calories} سعرة)` : ""}`,
    description: w.summary ?? `${w.title}: ${mealLabel(w.meal)} صحي بالشرح والماكروز.`,
    alternates: { canonical: `/no-deprivation/${w.slug}` },
  };
}

export default async function NutritionPage({ params }: PageProps<"/no-deprivation/[slug]">) {
  const { slug } = await params;
  const w = await getNutrition(slug);
  if (!w) notFound();
  const chip = "rounded-full bg-white/10 px-3 py-1 text-xs";
  const v = w.video_url ? parseVideoUrl(w.video_url) : null;
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {v && <JsonLd data={{ "@context": "https://schema.org", "@type": "VideoObject", name: w.title, description: w.summary ?? w.title, inLanguage: "ar", thumbnailUrl: w.cover ?? undefined, embedUrl: v.embed?.replace("autoplay=1&", "") ?? undefined, contentUrl: v.url }} />}
      <Link href="/no-deprivation" className="text-sm text-accent hover:underline">← من غير حرمان</Link>
      <div className={`mt-4 grid gap-8 ${w.video_url ? "md:grid-cols-[300px_1fr]" : ""}`}>
        {w.video_url && (
          <div className="mx-auto w-full max-w-[300px] md:sticky md:top-6 md:self-start">
            <HomePlayer url={w.video_url} title={w.title} cover={w.cover} icon={mealIcon(w.meal)} gradient={mealGradient(w.meal)} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-black md:text-4xl">{w.title}</h1>
          {w.summary && <p className="mt-2 text-muted">{w.summary}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`${chip} !bg-accent font-bold !text-accent-foreground`}>{mealIcon(w.meal)} {mealLabel(w.meal)}</span>
            {w.calories != null && <span className={chip}>🔥 {w.calories} سعرة</span>}
            {w.protein != null && <span className={chip}>بروتين {w.protein}g</span>}
            {w.carbs != null && <span className={chip}>كارب {w.carbs}g</span>}
            {w.fat != null && <span className={chip}>دهون {w.fat}g</span>}
          </div>
          {w.body && <section className="mt-8 rounded-3xl bg-surface p-5 ring-1 ring-white/10"><RichText text={w.body} /></section>}

          {w.products.length > 0 && (
            <section className="mt-10 rounded-3xl bg-surface p-5 ring-1 ring-white/10">
              <h2 className="text-lg font-bold">🛒 المنتجات المستخدمة</h2>
              <p className="text-sm text-muted">لو حبيت تجيب نفس المنتجات.</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {w.products.map((p) => (
                  <li key={p.id} className="flex flex-col overflow-hidden rounded-2xl bg-background ring-1 ring-white/10">
                    <div className="aspect-[4/3] bg-black/40">
                      {p.image ? <img src={p.image} alt={p.name} loading="lazy" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-5xl opacity-50">{mealIcon(w.meal)}</div>}
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
          <Link href="/no-deprivation" className="mt-8 block rounded-2xl bg-accent p-5 text-accent-foreground transition hover:brightness-110">
            <p className="text-lg font-extrabold">احسب سعراتك</p>
            <p className="text-sm opacity-80">حاسبة FFM والماكروز على صفحة من غير حرمان ←</p>
          </Link>
        </div>
      </div>
      {w.related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">كمان من {mealLabel(w.meal)}</h2>
          <div className="flex flex-wrap gap-2">{w.related.map((r) => <Link key={r.slug} href={`/no-deprivation/${r.slug}`} className="rounded-full bg-surface px-4 py-1.5 text-sm ring-1 ring-white/10 hover:ring-accent">{r.title}</Link>)}</div>
        </section>
      )}
      <p className="mt-10 text-xs text-muted">⚠️ {NUTRITION_NOTE}</p>
    </div>
  );
}
