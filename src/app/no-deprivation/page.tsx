import type { Metadata } from "next";
import Link from "next/link";
import { listNutrition } from "@/lib/nutrition";
import { JsonLd } from "@/lib/jsonld";
import { baseUrl } from "@/lib/base-url";
import { NUTRITION_NOTE } from "@/lib/nutrition-meta";
import { NutritionExplorer } from "@/components/NutritionExplorer";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "من غير حرمان — حاسبة سعرات وFFM ووصفات وخطط أكل بالعربي",
  description: "احسب سعراتك والماكروز من كتلتك الخالية FFM، وشوف وصفات وخطط فطور وغداء وعشاء وسناك ومشروبات بالفيديو والشرح، بدون حرمان.",
  alternates: { canonical: "/no-deprivation" },
};

export default async function NoDeprivation() {
  const items = await listNutrition();
  const steps = [["🧮", "احسب سعراتك"], ["🍽️", "اختار وجباتك"], ["▶", "شغّل السلسلة"]];
  return (
    <div className="mx-auto max-w-5xl px-4 pb-10">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: "من غير حرمان — وصفات وخطط أكل", inLanguage: "ar", itemListElement: items.map((e, i) => ({ "@type": "ListItem", position: i + 1, name: e.title, url: `${baseUrl()}/no-deprivation/${e.slug}` })) }} />
      <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-surface px-6 py-10 ring-1 ring-white/10 md:px-12 md:py-14">
        <span aria-hidden className="pointer-events-none absolute -top-24 start-1/2 size-80 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-24 end-0 size-72 rounded-full bg-amber-400/10 blur-3xl" />
        <p className="relative text-sm font-bold text-accent">🥗 أكل بذكاء</p>
        <h1 className="relative mt-2 text-4xl font-black leading-tight md:text-6xl">من غير <span className="text-accent">حرمان</span></h1>
        <p className="relative mt-3 max-w-xl text-lg text-muted">ما في أكل ممنوع، في أكل محسوب. احسب احتياجك، وجرّب وصفات وخطط بالفيديو والشرح بالأردني.</p>
        <ol className="relative mt-6 flex flex-wrap gap-2 text-sm">
          {steps.map(([i, t], k) => <li key={t} className="flex items-center gap-2 rounded-full bg-black/30 px-4 py-1.5 ring-1 ring-white/10"><span>{i}</span>{k + 1}. {t}</li>)}
        </ol>
      </section>
      <NutritionExplorer items={items} />
      <section className="mt-12 grid gap-3 md:grid-cols-2">
        <Link href="/no-gym" className="rounded-2xl bg-accent p-5 text-accent-foreground transition hover:brightness-110">
          <p className="text-lg font-extrabold">كمّل بتمارين من البيت</p>
          <p className="text-sm opacity-80">سلسلة كاملة بحبال المقاومة وأدوات البيت ←</p>
        </Link>
        <Link href="/directory" className="rounded-2xl bg-surface p-5 ring-1 ring-white/10 transition hover:ring-accent">
          <p className="text-lg font-extrabold">النوادي والكباتن</p>
          <p className="text-sm text-muted">قارن الأسعار وشوف القريب منك ←</p>
        </Link>
      </section>
      <p className="mt-8 text-xs text-muted">⚠️ {NUTRITION_NOTE}</p>
    </div>
  );
}
