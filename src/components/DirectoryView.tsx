import Link from "next/link";
import { OrgCard } from "@/components/OrgCard";
import { ORG_TYPE_PLURAL } from "@/lib/format";
import type { Enums } from "@/lib/database.types";

type Org = Parameters<typeof OrgCard>[0]["org"] & { id: string };

export function DirectoryView({ type, city, items, total, cities }: {
  type: Enums<"org_type">; city?: string; items: Org[]; total: number; cities: { city: string; n: number }[];
}) {
  const title = city ? `${ORG_TYPE_PLURAL[type]} في ${city}` : `${ORG_TYPE_PLURAL[type]} في الأردن`;
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <nav aria-label="مسار التنقل" className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        <Link href="/" className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">الرئيسية</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/directory/${type}`} className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">{ORG_TYPE_PLURAL[type]}</Link>
        {city && <><span aria-hidden="true">/</span><span aria-current="page" className="text-foreground">{city}</span></>}
      </nav>

      <header className="rounded-3xl border border-[#e0e9df] bg-gradient-to-br from-white to-[#f0f8ee] p-5 shadow-sm sm:p-7">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">تصفّح الأنشطة وقارن الأسعار والدوام والموقع وطرق التواصل المباشر.</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent" aria-live="polite">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />
          {total.toLocaleString("ar-JO")} {total === 1 ? "نتيجة" : "نتيجة متاحة"}
        </p>
      </header>

      {cities.length > 0 && (
        <nav aria-label="تصفية حسب المدينة" className="mt-5">
          <p className="mb-2 text-sm font-semibold text-muted">{city ? "مدن أخرى" : "تصفّح حسب المدينة"}</p>
          <div className="flex gap-2 overflow-x-auto pb-2 text-sm sm:flex-wrap sm:overflow-visible">
            {cities.map((c) => {
              const active = c.city === city;
              return (
                <Link key={c.city} href={`/directory/${type}/${encodeURIComponent(c.city)}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? "bg-accent text-accent-foreground ring-accent" : "bg-surface ring-white/10 hover:ring-accent"}`}>
                  {c.city}<span className={active ? "opacity-80" : "text-muted"}>{c.n.toLocaleString("ar-JO")}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {items.length > 0 ? (
        <section aria-label="نتائج الدليل" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((o) => <OrgCard key={o.id} org={o} />)}
        </section>
      ) : (
        <section className="mt-6 rounded-3xl border border-dashed border-[#c9ddca] bg-white px-5 py-12 text-center" aria-live="polite">
          <p className="text-lg font-bold">ما لقينا نتائج في هذا القسم حاليًا</p>
          <p className="mt-2 text-sm text-muted">جرّب مدينة ثانية أو ارجع للدليل الكامل لاستكشاف الخيارات المتاحة.</p>
          <Link href={`/directory/${type}`} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 py-2 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">عرض الدليل الكامل</Link>
        </section>
      )}
    </main>
  );
}
