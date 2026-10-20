import Link from "next/link";
import { FlashStrip } from "@/components/FlashStrip";
import { OrgCard } from "@/components/OrgCard";
import { TrailCard } from "@/components/TrailCard";
import { adImageUrl, listLiveAds } from "@/lib/ads";
import { listActiveOffers, listHomeSections, listLiveFlash, listPartners, listTrails } from "@/lib/queries";
import { ORG_TYPE_LABEL } from "@/lib/format";

export const revalidate = 300;

export default async function Home() {
  const [home, offers, ads, flash, partners, trails] = await Promise.all([
    listHomeSections().catch(() => ({ sections: [], pink: { total: 0, items: [] } })),
    listActiveOffers(6).catch(() => []),
    listLiveAds().catch(() => []),
    listLiveFlash(6).catch(() => []),
    listPartners().catch(() => []),
    listTrails().catch(() => []),
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
          <Link href="/trails" className="rounded-full bg-surface px-4 py-1.5 ring-1 ring-white/10 hover:ring-accent">🥾 مسارات المشي والهايكنق</Link>
          <Link href="/tools" className="rounded-full bg-surface px-4 py-1.5 ring-1 ring-white/10 hover:ring-accent">🧮 حاسبة السعرات</Link>
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
      <FlashStrip items={flash} />
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
      {home.pink.items.length > 0 && (
        <section className="mb-12 rounded-3xl bg-pink-500/10 p-5 ring-1 ring-pink-400/30">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-pink-200">💗 Pink Zone — خاص بالنساء</h2>
            <Link href="/search?women=only" className="text-sm text-pink-200 underline">عرض الكل ({home.pink.total})</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{home.pink.items.map((o) => <OrgCard key={o.id} org={o} />)}</div>
        </section>
      )}
      {home.sections.length === 0 ? (
        <p className="rounded-2xl bg-surface p-8 text-center text-muted">لا توجد أنشطة منشورة بعد. كن أول من يضيف نشاطه!</p>
      ) : (
        home.sections.map((s) => (
          <section key={s.key} className="mb-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{s.title}</h2>
              <Link href={s.href} className="text-sm text-accent underline">عرض الكل ({s.total})</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{s.items.map((o) => <OrgCard key={o.id} org={o} />)}</div>
          </section>
        ))
      )}
      {trails.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex items-baseline justify-between"><h2 className="text-xl font-bold">🥾 مسارات المشي والهايكنق</h2><Link href="/trails" className="text-sm text-accent underline">كل المسارات</Link></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{trails.slice(0, 6).map((t) => <TrailCard key={t.id} t={t} />)}</div>
        </section>
      )}
      {partners.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-center text-sm font-bold text-muted">شركاء المنصة</h2>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {partners.map((p) => {
              const img = (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={adImageUrl(p.logo_path)!} alt={p.name_ar} loading="lazy" className="h-14 w-auto max-w-40 object-contain opacity-80 transition hover:opacity-100" />
              );
              const href = p.link_url ?? (p.organizations ? `/g/${p.organizations.slug}` : null);
              return href ? <a key={p.id} href={href} rel="sponsored noopener" title={p.name_ar}>{img}</a> : <span key={p.id} title={p.name_ar}>{img}</span>;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
