import Link from "next/link";
import { FlashStrip } from "@/components/FlashStrip";
import { OrgCard } from "@/components/OrgCard";
import { TrailCard } from "@/components/TrailCard";
import { GymJoMotion } from "@/components/GymJoMotion";
import { adImageUrl, listLiveAds } from "@/lib/ads";
import { listActiveOffers, listCities, listHomeSections, listLiveFlash, listPartners, listTrails } from "@/lib/queries";
import { getSiteSettings } from "@/lib/site-settings";
import { FeatureDirectory } from "@/components/FeatureDirectory";

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
export const revalidate = 300;

export default async function Home() {
  // What shows here (blocks, cards per section, hero text) is set by the platform owner in /admin/settings.
  const cfg = await getSiteSettings();
  const show = cfg.home;
  const [home, offersRaw, ads, flash, partners, trails, cities] = await Promise.all([
    listHomeSections(cfg.perSection).catch(() => ({ sections: [], pink: { total: 0, items: [] } })),
    listActiveOffers(6).catch(() => []),
    listLiveAds().catch(() => []),
    listLiveFlash(6).catch(() => []),
    listPartners().catch(() => []),
    listTrails().catch(() => []),
    listCities().catch(() => []),
  ]);
  // One card per offer title per place (seeded data repeats titles).
  const offers = offersRaw.filter((o, i, a) => a.findIndex((x) => x.title_ar === o.title_ar && x.organizations?.slug === o.organizations?.slug) === i);
  const sorted = [...home.sections].sort((a, b) => b.total - a.total);
  const full = cfg.maxSections > 0 ? sorted.slice(0, cfg.maxSections) : sorted;
  const fullKeys = new Set(full.map((s) => s.key));
  const tiles = home.sections.filter((s) => !fullKeys.has(s.key));
  const banner = ads.find((a) => a.placement === "banner");
  const sponsored = ads.filter((a) => a.placement === "sponsored").slice(0, 3);
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="relative isolate -mx-4 overflow-hidden rounded-b-[2rem] bg-[#f3f8ee] px-4 pb-8 pt-7 text-[#18372a] sm:rounded-b-[2.5rem] sm:px-8 sm:pb-10 sm:pt-10">
        <div className="mx-auto grid max-w-7xl items-center gap-6 lg:grid-cols-[1fr_.85fr] lg:gap-10">
          <div data-gymjo-reveal className="text-right">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[#1d6b45] shadow-sm sm:text-sm"><span aria-hidden>🐼</span> دليلك الرياضي في الأردن</div>
            <h1 className="max-w-3xl text-3xl font-black leading-[1.35] tracking-tight sm:text-4xl lg:text-5xl">
              {cfg.heroTitle}<br /><span className="text-[#21834f]">{cfg.heroAccent}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#617568] sm:text-base">{cfg.heroSubtitle}</p>
            <form action="/search" className="mt-6 grid gap-2 rounded-2xl bg-white p-2 shadow-lg shadow-[#1c5737]/10 ring-1 ring-[#dce9dd] sm:grid-cols-[1fr_auto]">
              <label className="flex min-w-0 items-center gap-3 rounded-xl bg-[#f6f9f4] px-4">
                <span aria-hidden className="text-xl text-[#21834f]">⌕</span>
                <input name="q" aria-label="بحث" placeholder="ابحث عن نادي، ملاعب، مدرب..." className="min-w-0 flex-1 bg-transparent py-4 text-[#18372a] outline-none placeholder:text-[#819187] focus:ring-0" />
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                <select name="city" aria-label="المدينة" defaultValue="" className="min-h-12 min-w-0 rounded-xl bg-[#f6f9f4] px-3 py-3 text-sm text-[#18372a] ring-1 ring-[#e3ebe2] focus:ring-[#21834f]">
                  <option value="">كل المدن</option>
                  {cities.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
                </select>
                <button className="min-h-12 rounded-xl bg-[#21834f] px-5 py-3 font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#17683d]">اكتشف الآن <span aria-hidden>←</span></button>
              </div>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#617568] sm:text-sm"><span>✓ قارن قبل ما تشترك</span><span>✓ معلومات محلية</span><span>✓ تواصل مباشر</span></div>
          </div>
          <div data-gymjo-reveal className="relative isolate overflow-hidden rounded-[1.75rem] bg-white p-4 shadow-lg shadow-[#1c5737]/8 ring-1 ring-[#dce9dd] sm:p-5">
            <GymJoMotion />
            <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
              <div><p className="text-xs font-semibold text-[#819187]">ابدأ من هون</p><p className="mt-1 text-lg font-black">شو بتدور عليه اليوم؟</p></div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#e8f4e8] text-2xl">🏃</span>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-3">
              {TYPE_TILES.slice(0, 4).map((t) => <Link key={t.href} href={t.href} className="group flex items-center gap-3 rounded-2xl border border-[#e5eee4] bg-[#fbfcfa] p-3 transition hover:border-[#91c9a1] hover:bg-[#f0f8ee]"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f4e8] text-xl">{t.icon}</span><span className="text-sm font-extrabold">{t.label}</span><span aria-hidden className="mr-auto text-[#819187] transition group-hover:-translate-x-1">←</span></Link>)}
            </div>
            <Link href="/sections" className="relative z-10 mt-3 flex items-center justify-between rounded-xl bg-[#f0f8ee] px-4 py-3 text-sm font-extrabold text-[#21834f] transition hover:bg-[#e4f2e1]"><span>كل التصنيفات الرياضية</span><span aria-hidden>←</span></Link>
          </div>
        </div>
        {show.tiles && <div className="mx-auto mt-7 max-w-7xl border-t border-[#dce9dd] pt-5"><div className="mb-3 flex items-center justify-between"><p className="font-extrabold">تصفّح بسرعة</p><Link href="/sections" className="text-sm font-bold text-[#21834f]">كل الأقسام ←</Link></div><div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{TYPE_TILES.map((t) => <Link key={t.href} href={t.href} className="flex shrink-0 items-center gap-2 rounded-full border border-[#dce9dd] bg-white px-4 py-2.5 text-sm transition hover:border-[#91c9a1] hover:bg-[#f0f8ee]"><span aria-hidden className="text-lg">{t.icon}</span><span className="font-bold">{t.label}</span></Link>)}</div></div>}
      </section>
      {show.banner && banner && (
        <a href={`/a/${banner.id}`} rel="sponsored noopener" className="relative mb-10 block overflow-hidden rounded-2xl bg-surface ring-1 ring-white/10">
          {banner.image_path && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={adImageUrl(banner.image_path)!} alt={banner.title} className="aspect-[16/6] w-full object-cover" />
          )}
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs">إعلان</span>
          <div className="p-4"><p className="font-bold">{banner.title}</p>{banner.subtitle && <p className="text-sm text-muted">{banner.subtitle}</p>}</div>
        </a>
      )}
      {show.sponsored && sponsored.length > 0 && (
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
      {show.flash && <FlashStrip items={flash} />}
      {show.offers && offers.length > 0 && (
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
      {show.pink && home.pink.items.length > 0 && (
        <section className="mb-12 rounded-3xl bg-pink-500/10 p-5 ring-1 ring-pink-400/30">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-pink-200">💗 Pink Zone — خاص بالنساء</h2>
            <Link href="/search?women=only" className="text-sm text-pink-200 underline">عرض الكل ({home.pink.total})</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{home.pink.items.map((o) => <OrgCard key={o.id} org={o} />)}</div>
        </section>
      )}
      {!show.sections ? null : home.sections.length === 0 ? (
        <p className="rounded-2xl bg-surface p-8 text-center text-muted">لا توجد أنشطة منشورة بعد. كن أول من يضيف نشاطه!</p>
      ) : (
        <>
          {full.map((s) => (
            <section key={s.key} className="mb-12">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">{s.title}</h2>
                <Link href={s.href} className="text-sm text-accent underline">عرض الكل ({s.total})</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{s.items.map((o) => <OrgCard key={o.id} org={o} />)}</div>
              {s.total > s.items.length && (
                <Link href={s.href} className="mt-4 inline-block rounded-xl bg-surface px-4 py-2 text-sm font-bold text-accent ring-1 ring-white/10 hover:ring-accent">عرض كل {s.title} ({s.total})</Link>
              )}
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
      <FeatureDirectory />
      {show.trails && trails.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex items-baseline justify-between"><h2 className="text-xl font-bold">🥾 مسارات المشي والهايكنق</h2><Link href="/trails" className="text-sm text-accent underline">كل المسارات</Link></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{trails.slice(0, 6).map((t) => <TrailCard key={t.id} t={t} />)}</div>
        </section>
      )}
      {show.partners && partners.length > 0 && (
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
