import Link from "next/link";
import { OrgCard } from "@/components/OrgCard";
import { adImageUrl, listLiveAds } from "@/lib/ads";
import { listActiveOffers, searchOrgs } from "@/lib/queries";
import { ORG_TYPE_LABEL } from "@/lib/format";

export const revalidate = 300;

export default async function Home() {
  const [{ items }, offers, ads] = await Promise.all([
    searchOrgs({ page: 1 }).catch(() => ({ items: [], total: 0 })),
    listActiveOffers(6).catch(() => []),
    listLiveAds().catch(() => []),
  ]);
  const banner = ads.find((a) => a.placement === "banner");
  const sponsored = ads.filter((a) => a.placement === "sponsored").slice(0, 3);
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
      {banner && (
        <a href={`/a/${banner.id}`} rel="sponsored noopener" className="relative mb-10 block overflow-hidden rounded-2xl bg-surface ring-1 ring-white/10">
          {banner.image_path && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={adImageUrl(banner.image_path)!} alt={banner.title} className="aspect-[16/6] w-full object-cover" />
          )}
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs">إعلان</span>
          <div className="p-4"><p className="font-bold">{banner.title}</p>{banner.subtitle && <p className="text-sm text-muted">{banner.subtitle}</p>}</div>
        </a>
      )}
      {sponsored.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">ممول</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sponsored.map((a) => (
              <a key={a.id} href={`/a/${a.id}`} rel="sponsored noopener" className="relative block overflow-hidden rounded-2xl bg-surface ring-1 ring-white/10 hover:ring-accent/60">
                {a.image_path && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={adImageUrl(a.image_path)!} alt={a.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                )}
                <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs">إعلان</span>
                <div className="p-5"><h3 className="font-bold">{a.title}</h3>{a.subtitle && <p className="mt-1 text-sm text-muted">{a.subtitle}</p>}</div>
              </a>
            ))}
          </div>
        </section>
      )}
      {offers.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">عروض ودورات حالية</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <Link key={o.id} href={`/g/${o.organizations!.slug}`} className="rounded-2xl bg-surface p-5 ring-1 ring-white/10 hover:ring-accent/60">
                <p className="text-xs text-accent">{o.kind === "course" ? "دورة" : o.discount_percent ? `خصم ${o.discount_percent}%` : "عرض"}</p>
                <h3 className="mt-1 font-bold">{o.title_ar}</h3>
                <p className="mt-1 text-sm text-muted">{o.organizations!.name_ar} · {o.organizations!.city}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
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
