import Link from "next/link";
import { FlashStrip } from "@/components/FlashStrip";
import { OrgCard } from "@/components/OrgCard";
import { TrailCard } from "@/components/TrailCard";
import { adImageUrl, listLiveAds } from "@/lib/ads";
import { listActiveOffers, listCities, listHomeSections, listLiveFlash, listPartners, listTrails } from "@/lib/queries";

const TYPE_TILES = [
  { href: "/search?type=gym", icon: "🏋️", label: "نوادي" },
  { href: "/search?type=independent_coach", icon: "🧑‍🏫", label: "مدربين" },
  { href: "/search?type=sports_facility", icon: "⚽", label: "ملاعب" },
  { href: "/pink", icon: "💗", label: "للنساء" },
  { href: "/search?type=nutritionist", icon: "🥗", label: "تغذية" },
  { href: "/search?type=healthy_food", icon: "🍱", label: "أكل صحي" },
  { href: "/search?type=store", icon: "🛍️", label: "متاجر" },
  { href: "/search?type=sports_health", icon: "🩺", label: "علاج رياضي" },
];
/** Full sections shown on the home page; the rest become compact category tiles. */
const FULL_SECTIONS = 3;

export const revalidate = 300;

export default async function Home() {
  const [home, offersRaw, ads, flash, partners, trails, cities] = await Promise.all([
    listHomeSections().catch(() => ({ sections: [], pink: { total: 0, items: [] } })),
    listActiveOffers(6).catch(() => []),
    listLiveAds().catch(() => []),
    listLiveFlash(6).catch(() => []),
    listPartners().catch(() => []),
    listTrails().catch(() => []),
    listCities().catch(() => []),
  ]);
  // One card per offer title per place (seeded data repeats titles).
  const offers = offersRaw.filter((o, i, a) => a.findIndex((x) => x.title_ar === o.title_ar && x.organizations?.slug === o.organizations?.slug) === i);
  const full = [...home.sections].sort((a, b) => b.total - a.total).slice(0, FULL_SECTIONS);
  const fullKeys = new Set(full.map((s) => s.key));
  const tiles = home.sections.filter((s) => !fullKeys.has(s.key));
  const banner = ads.find((a) => a.placement === "banner");
  const sponsored = ads.filter((a) => a.placement === "sponsored").slice(0, 3);
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-10 text-center sm:py-14">
        <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
          دليلك للرياضة في الأردن، <span className="text-accent">أسعار حقيقية</span> وتواصل مباشر
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted sm:text-base">
          نوادي، مدربين، منشآت ومتاجر رياضية: الأسعار، الدوام، الموقع والتواصل المباشر في مكان واحد.
        </p>
        <form action="/search" className="mx-auto mt-6 grid max-w-2xl gap-2 rounded-2xl bg-surface p-2 ring-1 ring-white/10 sm:grid-cols-[1fr_auto_auto]">
          <input name="q" aria-label="بحث" placeholder="ابحث عن نادي أو مدرب أو رياضة..." className="rounded-xl bg-background px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-accent" />
          <select name="city" aria-label="المدينة" defaultValue="" className="rounded-xl bg-background px-3 py-3 ring-1 ring-white/10">
            <option value="">كل المدن</option>
            {cities.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
          </select>
          <button className="rounded-xl bg-accent px-6 py-3 font-bold text-accent-foreground">بحث</button>
        </form>
        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-4 gap-2 text-xs sm:grid-cols-4 sm:text-sm">
          {TYPE_TILES.map((t) => (
            <Link key={t.href} href={t.href} className="flex flex-col items-center gap-1 rounded-2xl bg-surface px-2 py-3 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-accent">
              <span className="text-2xl" aria-hidden>{t.icon}</span><span className="font-semibold">{t.label}</span>
            </Link>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{home.pink.items.slice(0, 3).map((o) => <OrgCard key={o.id} org={o} />)}</div>
        </section>
      )}
      {home.sections.length === 0 ? (
        <p className="rounded-2xl bg-surface p-8 text-center text-muted">لا توجد أنشطة منشورة بعد. كن أول من يضيف نشاطه!</p>
      ) : (
        <>
          {full.map((s) => (
            <section key={s.key} className="mb-12">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">{s.title}</h2>
                <Link href={s.href} className="text-sm text-accent underline">عرض الكل ({s.total})</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{s.items.slice(0, 3).map((o) => <OrgCard key={o.id} org={o} />)}</div>
            </section>
          ))}
          {tiles.length > 0 && (
            <section className="mb-12">
              <h2 className="mb-4 text-xl font-bold">تصفّح حسب القسم</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {tiles.map((s) => (
                  <Link key={s.key} href={s.href} className="flex items-center justify-between gap-2 rounded-xl bg-surface px-4 py-3 text-sm ring-1 ring-white/10 hover:ring-accent">
                    <span className="font-semibold">{s.title}</span><span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted">{s.total}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
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
