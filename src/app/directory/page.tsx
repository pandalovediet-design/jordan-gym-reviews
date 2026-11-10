import type { Metadata } from "next";
import Link from "next/link";
import { listCities } from "@/lib/queries";
import { ORG_TYPE_PLURAL } from "@/lib/format";
import type { Enums } from "@/lib/database.types";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "دليل الرياضة في الأردن: نوادي ومدربون ومتاجر",
  description: "تصفّح كل الأنشطة الرياضية في الأردن حسب النوع والمدينة: نوادي، مدربون، ملاعب، متاجر، أخصائيو تغذية.",
  alternates: { canonical: "/directory" },
};

const TYPE_ICONS: Partial<Record<Enums<"org_type">, string>> = {
  gym: "🏋️",
  independent_coach: "🧑‍🏫",
  sports_facility: "⚽",
  nutritionist: "🥗",
  store: "🛍️",
  sports_health: "🩺",
  healthy_food: "🍱",
};

export default async function DirectoryIndex() {
  const types = Object.keys(ORG_TYPE_PLURAL) as Enums<"org_type">[];
  const rows = await Promise.all(types.map(async (t) => ({ t, cities: await listCities(t).catch(() => []) })));
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(200,245,58,.13),transparent_48%),linear-gradient(135deg,var(--surface),var(--background))] p-5 sm:p-8">
        <div className="relative">
          <p className="mb-2 text-sm font-bold text-accent">GYMJO DIRECTORY</p>
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl">دليل الرياضة في الأردن</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted sm:text-base">كل الخيارات الرياضية بمكان واحد. اختار نوع النشاط، وبعدها مدينتك لتوصل للمكان المناسب إلك.</p>
          <Link href="/search" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-extrabold text-accent-foreground transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">ابحث بكل الأنشطة <span aria-hidden>←</span></Link>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
        {rows.map(({ t, cities }) => (
          <section key={t} className="min-w-0 rounded-2xl border border-white/10 bg-surface p-4 shadow-sm transition-colors hover:border-accent/30 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background text-xl ring-1 ring-white/10">{TYPE_ICONS[t] ?? "✦"}</span>
                <h2 className="truncate text-base font-extrabold sm:text-lg"><Link href={`/directory/${t}`} className="rounded-sm hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{ORG_TYPE_PLURAL[t]}</Link></h2>
              </div>
              <Link href={`/directory/${t}`} className="shrink-0 text-xs font-bold text-accent hover:underline sm:text-sm">كل النتائج <span aria-hidden>←</span></Link>
            </div>
            <div className="mt-4 border-t border-white/10 pt-3">
              <p className="mb-2 text-xs font-semibold text-muted">تصفّح حسب المدينة</p>
              {cities.length === 0 ? <span className="text-sm text-muted">قريباً</span> : (
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {cities.map((c) => <Link key={c.city} href={`/directory/${t}/${encodeURIComponent(c.city)}`} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-semibold ring-1 ring-white/10 transition hover:ring-accent sm:text-sm">{c.city}<span className="text-muted">{c.n}</span></Link>)}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
      <Link href="/pink" className="mt-5 flex min-h-14 items-center justify-between rounded-2xl border border-pink-400/25 bg-pink-500/10 px-5 py-4 text-sm font-bold text-pink-200 transition hover:bg-pink-500/15">
        <span>💗 استكشف Pink Zone — خيارات رياضية مخصصة للنساء</span><span aria-hidden>←</span>
      </Link>
    </main>
  );
}
