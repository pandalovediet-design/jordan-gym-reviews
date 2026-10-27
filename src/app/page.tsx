import Link from "next/link";
import { FlashStrip } from "@/components/FlashStrip";
import { OrgCard } from "@/components/OrgCard";
import { TrailCard } from "@/components/TrailCard";
import { adImageUrl, listLiveAds } from "@/lib/ads";
import { listActiveOffers, listCities, listHomeSections, listLiveFlash, listPartners, listTrails } from "@/lib/queries";
import { getSiteSettings } from "@/lib/site-settings";

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
      <section className="relative isolate -mx-4 overflow-hidden rounded-b-[2rem] border-b border-white/10 bg-[radial-gradient(ellipse_at_15%_10%,rgba(54,120,246,.22),transparent_38%),radial-gradient(ellipse_at_85%_80%,rgba(98,214,232,.10),transparent_34%)] px-4 pb-10 pt-8 sm:rounded-b-[2.75rem] sm:px-8 sm:pb-16 sm:pt-12 lg:pb-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-14">
          <div className="text-right">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-200 sm:text-sm"><span className="size-2 animate-pulse rounded-full bg-emerald-400" /> دليلك الرياضي من عمّان لكل الأردن</div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.25] tracking-tight sm:text-5xl lg:text-6xl">
              {cfg.heroTitle}<br /><span className="bg-gradient-to-l from-cyan-200 via-blue-300 to-blue-500 bg-clip-text text-transparent">{cfg.heroAccent}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">{cfg.heroSubtitle}</p>
            <form action="/search" className="mt-8 grid gap-2 rounded-2xl border border-white/10 bg-surface/90 p-2 shadow-2xl shadow-black/20 backdrop-blur sm:grid-cols-[1fr_auto]">
              <label className="flex min-w-0 items-center gap-3 rounded-xl bg-background/70 px-4">
                <span aria-hidden className="text-xl text-cyan-200">⌕</span>
                <input name="q" aria-label="بحث" placeholder="شو حاب تتمرّن؟ نادي، مدرب، ملاعب..." className="min-w-0 flex-1 bg-transparent py-4 outline-none placeholder:text-muted/80 focus:ring-0" />
              </label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <select name="city" aria-label="المدينة" defaultValue="" className="min-w-0 rounded-xl bg-background px-3 py-3 text-sm ring-1 ring-white/10 focus:ring-cyan-300">
                  <option value="">كل المدن</option>
                  {cities.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
                </select>
                <button className="rounded-xl bg-gradient-to-l from-blue-500 to-blue-600 px-6 py-3 font-extrabold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:brightness-110">اكتشف الآن <span aria-hidden>←</span></button>
              </div>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted sm:text-sm"><span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> قارن قبل ما تشترك</span><span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> معلومات محلية</span><span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> تواصل مباشر</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-lg lg:me-0">
            <div aria-hidden className="absolute inset-8 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#243653] via-[#18253a] to-[#111827] p-4 shadow-2xl shadow-black/40 sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div><p className="text-xs text-muted">رحلتك الرياضية تبدأ هون</p><p className="mt-1 text-lg font-extrabold">اختار أسلوبك</p></div>
                <span className="rounded-2xl border border-cyan-200/20 bg-cyan-200/10 p-3 text-2xl">✦</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link href="/search?type=gym" className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-1 hover:border-blue-400/50 hover:bg-blue-400/10"><span className="mb-6 flex size-11 items-center justify-center rounded-xl bg-blue-500/20 text-2xl">🏋️</span><span className="block font-extrabold">نوادي رياضية</span><span className="mt-1 block text-xs text-muted">اعرف الأسعار والمرافق</span></Link>
                <Link href="/search?type=independent_coach" className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-1 hover:border-cyan-300/50 hover:bg-cyan-300/10"><span className="mb-6 flex size-11 items-center justify-center rounded-xl bg-cyan-300/15 text-2xl">🧑‍🏫</span><span className="block font-extrabold">مدربين شخصيين</span><span className="mt-1 block text-xs text-muted">خطة تناسب هدفك</span></Link>
                <Link href="/search?type=sports_facility" className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-1 hover:border-orange-300/50 hover:bg-orange-300/10"><span className="mb-6 flex size-11 items-center justify-center rounded-xl bg-orange-400/15 text-2xl">⚽</span><span className="block font-extrabold">ملاعب ومنشآت</span><span className="mt-1 block text-xs text-muted">احجز لعبتك الجاية</span></Link>
                <Link href="/pink" className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-1 hover:border-pink-300/50 hover:bg-pink-300/10"><span className="mb-6 flex size-11 items-center justify-center rounded-xl bg-pink-400/15 text-2xl">💗</span><span className="block font-extrabold">مساحات للنساء</span><span className="mt-1 block text-xs text-muted">خيارات تناسبك</span></Link>
              </div>
              <Link href="/search" className="mt-3 flex items-center justify-between rounded-2xl border border-blue-300/20 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-100 transition hover:bg-blue-500/20"><span>استكشف كل الأنشطة الرياضية</span><span aria-hidden>←</span></Link>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-black/20 p-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-lg">⌖</span><div><p className="text-sm font-bold">منطقتك، ميزانيتك، هدفك</p><p className="mt-0.5 text-xs text-muted">اكتشف خيارات أقرب لإلك بدل البحث العشوائي</p></div></div>
            </div>
            <div className="absolute -left-2 top-10 hidden -translate-x-1/4 rounded-2xl border border-white/10 bg-surface/95 px-4 py-3 shadow-xl backdrop-blur sm:block"><p className="text-xs text-muted">قرار أذكى</p><p className="mt-1 text-sm font-extrabold">قارن. اختار. انطلق.</p></div>
          </div>
        </div>
        {show.tiles && <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 sm:mt-14"><div className="mb-4 flex items-center justify-between"><p className="font-extrabold">تصفّح حسب اهتمامك</p><Link href="/sections" className="text-sm text-cyan-200 hover:text-white">كل الأقسام ←</Link></div><div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{TYPE_TILES.map((t) => <Link key={t.href} href={t.href} className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-surface/70 px-4 py-2.5 text-sm transition hover:border-cyan-300/40 hover:bg-cyan-300/10"><span aria-hidden className="text-lg">{t.icon}</span><span className="font-bold">{t.label}</span></Link>)}</div></div>}
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
