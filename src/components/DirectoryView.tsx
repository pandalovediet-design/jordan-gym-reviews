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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-3 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">الرئيسية</Link> / <Link href={`/directory/${type}`} className="hover:text-foreground">{ORG_TYPE_PLURAL[type]}</Link>
        {city && <> / {city}</>}
      </nav>
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-2 text-muted">{total} نتيجة. الأسعار والدوام والموقع وطرق التواصل المباشر لكل نشاط.</p>
      {cities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {cities.map((c) => (
            <Link key={c.city} href={`/directory/${type}/${encodeURIComponent(c.city)}`}
              className={`rounded-full px-4 py-1.5 ring-1 ring-white/10 ${c.city === city ? "bg-accent text-accent-foreground" : "bg-surface hover:ring-accent"}`}>{c.city} ({c.n})</Link>
          ))}
        </div>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((o) => <OrgCard key={o.id} org={o} />)}</div>
    </div>
  );
}
