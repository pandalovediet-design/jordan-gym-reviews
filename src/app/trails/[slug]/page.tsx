import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adImageUrl } from "@/lib/ads";
import { TRAIL_DIFFICULTY, TRAIL_TYPE } from "@/lib/format";
import { getTrail } from "@/lib/queries";

export const revalidate = 300;
const load = cache(getTrail);

export async function generateMetadata({ params }: PageProps<"/trails/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = await load(decodeURIComponent(slug)).catch(() => null);
  if (!t) return { title: "غير موجود" };
  return { title: t.name_ar, description: t.description_ar?.slice(0, 160) ?? `${t.name_ar} - ${t.region}`, alternates: { canonical: `/trails/${t.slug}` } };
}

export default async function TrailPage({ params }: PageProps<"/trails/[slug]">) {
  const { slug } = await params;
  const t = await load(decodeURIComponent(slug)).catch(() => null);
  if (!t) notFound();
  const img = adImageUrl(t.image_path);
  const stats: [string, string][] = [
    ["النوع", TRAIL_TYPE[t.trail_type as keyof typeof TRAIL_TYPE]],
    ["الصعوبة", TRAIL_DIFFICULTY[t.difficulty as keyof typeof TRAIL_DIFFICULTY]],
    ...(t.distance_km != null ? [["المسافة", `${t.distance_km} كم`] as [string, string]] : []),
    ...(t.duration_min != null ? [["المدة", t.duration_min >= 60 ? `${Math.floor(t.duration_min / 60)} س ${t.duration_min % 60} د` : `${t.duration_min} د`] as [string, string]] : []),
    ...(t.elevation_gain_m != null ? [["الصعود", `${t.elevation_gain_m} م`] as [string, string]] : []),
  ];
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={t.name_ar} className="h-64 w-full rounded-2xl object-cover" />
      )}
      <header><h1 className="text-3xl font-extrabold">{t.name_ar}</h1><p className="text-muted">{t.region}</p></header>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(([k, v]) => <div key={k} className="rounded-xl bg-surface p-3 text-center ring-1 ring-white/10"><dt className="text-xs text-muted">{k}</dt><dd className="font-bold">{v}</dd></div>)}
      </dl>
      {t.description_ar && <p className="whitespace-pre-line leading-8">{t.description_ar}</p>}
      {t.tips_ar && <section className="rounded-2xl bg-surface p-5 ring-1 ring-white/10"><h2 className="mb-2 font-bold">نصائح</h2><p className="whitespace-pre-line text-sm leading-7 text-muted">{t.tips_ar}</p></section>}
      {t.maps_url && <a href={t.maps_url} target="_blank" rel="noopener noreferrer" className="inline-block rounded-xl bg-accent px-5 py-2.5 font-bold text-black">📍 الموقع على الخريطة</a>}
    </article>
  );
}
