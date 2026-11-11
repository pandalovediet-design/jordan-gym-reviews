import Link from "next/link";
import { OrgCard } from "@/components/OrgCard";
import { ORG_TYPE_PLURAL } from "@/lib/format";
import type { Enums } from "@/lib/database.types";
import { PageHead, btn } from "@/components/PageHead";

type Org = Parameters<typeof OrgCard>[0]["org"] & { id: string };

export function DirectoryView({ type, city, items, total, cities }: {
  type: Enums<"org_type">; city?: string; items: Org[]; total: number; cities: { city: string; n: number }[];
}) {
  const title = city ? `${ORG_TYPE_PLURAL[type]} في ${city}` : `${ORG_TYPE_PLURAL[type]} في الأردن`;
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <nav aria-label="مسار التنقل" className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        <Link href="/directory" className="hover:text-foreground">الدليل</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/directory/${type}`} className="hover:text-foreground">{ORG_TYPE_PLURAL[type]}</Link>
        {city && <><span aria-hidden="true">/</span><span aria-current="page" className="text-foreground">{city}</span></>}
      </nav>
      <PageHead title={title} note={<><span className="font-display text-xl font-bold text-foreground tabular-nums">{total.toLocaleString("en")}</span> مكان، مع الأسعار والدوام والتواصل المباشر.</>} />

      {cities.length > 0 && (
        <nav aria-label="تصفية حسب المدينة" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {city && <Link href={`/directory/${type}`} className={btn.chip}>كل المدن</Link>}
          {cities.map((c) => {
            const active = c.city === city;
            return (
              <Link key={c.city} href={`/directory/${type}/${encodeURIComponent(c.city)}`} aria-current={active ? "page" : undefined} className={active ? btn.chipOn : btn.chip}>
                {c.city}<span className={`font-normal tabular-nums ${active ? "opacity-80" : "text-muted"}`}>{c.n.toLocaleString("en")}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {items.length > 0 ? (
        <section aria-label="نتائج الدليل" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((o) => <OrgCard key={o.id} org={o} />)}
        </section>
      ) : (
        <section className="rounded-2xl bg-surface px-5 py-10 text-center ring-1 ring-line" aria-live="polite">
          <p className="font-display text-xl font-bold">ما في أماكن بهالقسم لسا</p>
          <p className="mt-2 text-sm text-muted">جرّب مدينة ثانية، أو ارجع للدليل كله.</p>
          <Link href="/directory" className={`${btn.primary} mt-5`}>كل الدليل</Link>
        </section>
      )}
      {total > items.length && items.length > 0 && (
        <p className="mt-8 text-center"><Link href={`/search?type=${type}${city ? `&city=${encodeURIComponent(city)}` : ""}&page=2`} className={btn.ghost}>باقي الأماكن ({(total - items.length).toLocaleString("en")})</Link></p>
      )}
    </main>
  );
}
