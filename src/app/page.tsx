import Link from "next/link";
import { OrgCard } from "@/components/OrgCard";
import { searchOrgs } from "@/lib/queries";
import { ORG_TYPE_LABEL } from "@/lib/format";

export const revalidate = 300;

export default async function Home() {
  const { items } = await searchOrgs({ page: 1 }).catch(() => ({ items: [], total: 0 }));
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-16 text-center">
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
          دليلك للرياضة في الأردن، <span className="text-accent">أسعار حقيقية</span> وتواصل مباشر
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          نوادي، مدربين، منشآت ومتاجر رياضية: الأسعار، الدوام، الموقع والتواصل المباشر في مكان واحد.
        </p>
        <form action="/search" className="mx-auto mt-8 flex max-w-xl gap-2">
          <input name="q" placeholder="ابحث عن نادي أو مدرب أو منتج..." className="flex-1 rounded-xl bg-surface px-4 py-3 ring-1 ring-white/10 outline-none focus:ring-accent" />
          <button className="rounded-xl bg-accent px-6 font-bold text-accent-foreground">بحث</button>
        </form>
        <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
          {Object.entries(ORG_TYPE_LABEL).map(([k, v]) => (
            <Link key={k} href={`/search?type=${k}`} className="rounded-full bg-surface px-4 py-1.5 ring-1 ring-white/10 hover:ring-accent">{v}</Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold">أحدث الأنشطة</h2>
        {items.length === 0 ? (
          <p className="rounded-2xl bg-surface p-8 text-center text-muted">لا توجد أنشطة منشورة بعد. كن أول من يضيف نشاطه!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((o) => <OrgCard key={o.id} org={o} />)}</div>
        )}
      </section>
    </div>
  );
}
