import type { Metadata } from "next";
import Link from "next/link";
import { listCities } from "@/lib/queries";
import { ORG_TYPE_PLURAL } from "@/lib/format";
import type { Enums } from "@/lib/database.types";
import { PageHead, btn } from "@/components/PageHead";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "دليل الرياضة في الأردن: نوادي ومدربون ومتاجر",
  description: "تصفّح كل الأنشطة الرياضية في الأردن حسب النوع والمدينة: نوادي، مدربون، ملاعب، متاجر، أخصائيو تغذية.",
  alternates: { canonical: "/directory" },
};

export default async function DirectoryIndex() {
  const types = Object.keys(ORG_TYPE_PLURAL) as Enums<"org_type">[];
  const rows = await Promise.all(types.map(async (t) => ({ t, cities: await listCities(t).catch(() => []) })));
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHead title="دليل الرياضة في الأردن" note="اختار نوع المكان، وبعدها مدينتك.">
        <Link href="/search" className={btn.primary}>دوّر بالاسم أو المنطقة</Link>
        <Link href="/now" className={btn.ghost}>فاتح هسا</Link>
      </PageHead>

      <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
        {rows.map(({ t, cities }) => {
          const total = cities.reduce((n, c) => n + c.n, 0);
          return (
            <section key={t} className="min-w-0">
              <h2 className="flex items-baseline justify-between gap-3 text-2xl font-bold">
                <Link href={`/directory/${t}`} className="underline-offset-4 hover:underline">{ORG_TYPE_PLURAL[t]}</Link>
                {total > 0 && <span className="font-display text-lg text-muted tabular-nums">{total}</span>}
              </h2>
              {cities.length === 0 ? <p className="mt-3 text-sm text-muted">قريباً</p> : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {cities.map((c) => <Link key={c.city} href={`/directory/${t}/${encodeURIComponent(c.city)}`} className={btn.chip}>{c.city}<span className="font-normal text-muted tabular-nums">{c.n}</span></Link>)}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <Link href="/pink" className="mt-10 flex min-h-16 items-center justify-between gap-4 rounded-2xl bg-pink-600 px-6 py-4 text-white">
        <span className="font-display text-xl font-bold">Pink Zone</span><span className="text-sm">أماكن وأوقات خاصة بالنساء</span>
      </Link>
    </main>
  );
}
