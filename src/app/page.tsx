import Link from "next/link";
import { FlashStrip } from "@/components/FlashStrip";
import { OrgCard } from "@/components/OrgCard";
import { TrailCard } from "@/components/TrailCard";
import { adImageUrl, listLiveAds } from "@/lib/ads";
import { listActiveOffers, listCities, listHomeSections, listLiveFlash, listPartners, listTrails } from "@/lib/queries";
import { getSiteSettings } from "@/lib/site-settings";
import { listExercises } from "@/lib/exercises";
import { createPublicClient } from "@/lib/supabase/public";
import { RevealCode } from "@/components/RevealCode";

const TYPE_TILES = [
  { href: "/search?type=gym", icon: "🏋️", label: "نوادي", description: "قارن النوادي والأسعار والمرافق." },
  { href: "/search?type=independent_coach", icon: "🧑‍🏫", label: "مدربين", description: "اعثر على مدرب يناسب هدفك." },
  { href: "/search?type=sports_facility", icon: "⚽", label: "ملاعب", description: "اكتشف الملاعب والمنشآت الرياضية." },
  { href: "/pink", icon: "💗", label: "للنساء", description: "مساحة رياضية مخصصة للسيدات." },
  { href: "/search?type=nutritionist", icon: "🥗", label: "تغذية", description: "مختصون يساعدونك بخطتك الغذائية." },
  { href: "/search?type=healthy_food", icon: "🍱", label: "أكل صحي", description: "خيارات أكل تدعم أسلوب حياة صحي." },
  { href: "/search?type=store", icon: "🛍️", label: "متاجر", description: "معدات ومنتجات رياضية." },
  { href: "/search?type=sports_health", icon: "🩺", label: "علاج رياضي", description: "خدمات العلاج والتأهيل الرياضي." },
];

const FEATURE_TILES = [
  { href: "/now", icon: "⏱️", label: "هسا", description: "اكتشف خيارات رياضية تناسب خطتك اليوم." },
  { href: "/awards", icon: "🏆", label: "نادي الشهر", description: "تابع الترشيحات واكتشف الأندية المميزة." },
  { href: "/exercises", icon: "💪", label: "مكتبة التمارين", description: "تعلّم التمارين وطريقة أدائها." },
  { href: "/log", icon: "🔥", label: "سجل تمريني", description: "سجّل نشاطك وتابع استمراريتك." },
  { href: "/challenges", icon: "🏆", label: "التحديات", description: "شارك بتحديات أسبوعية وتابع إنجازاتك." },
  { href: "/deals", icon: "🎟️", label: "أكواد الخصم", description: "وفّر مع عروض الأنشطة الرياضية." },
  { href: "/no-gym", icon: "🏠", label: "من غير جيم", description: "تمارين وأفكار بدون اشتراك نادي." },
  { href: "/no-deprivation", icon: "🥗", label: "من غير حرمان", description: "محتوى غذائي متوازن وواقعي." },
  { href: "/rooh-w-jasad", icon: "🕌", label: "روح وجسد", description: "اهتم بصحتك الجسدية والروحية." },
  { href: "/reels", icon: "🎬", label: "ريلز رياضية", description: "مقاطع قصيرة وملهمة من عالم الرياضة." },
  { href: "/market", icon: "🔄", label: "سوق المعدات", description: "اكتشف معدات رياضية للبيع والتبديل." },
  { href: "/trails", icon: "🥾", label: "المسارات", description: "اكتشف مسارات المشي والأنشطة الخارجية." },
  { href: "/tools", icon: "🧮", label: "الحاسبات والأدوات", description: "أدوات عملية تساعدك في رحلتك." },
  { href: "/favorites", icon: "❤️", label: "المفضلة", description: "احفظ الأنشطة وارجع لها بسهولة." },
];

async function listHomepageCodes() {
  try {
    const { data } = await createPublicClient().rpc("list_public_codes", {});
    return data ?? [];
  } catch {
    return [];
  }
}

export const revalidate = 300;

export default async function Home() {
  // Homepage content and visibility are configured by the platform owner in /admin/settings.
  const cfg = await getSiteSettings();
  const show = cfg.home;
  const [home, offersRaw, ads, flash, partners, trails, cities, exercises, codesRaw] = await Promise.all([
    listHomeSections(cfg.perSection).catch(() => ({ sections: [], pink: { total: 0, items: [] } })),
    listActiveOffers(6).catch(() => []),
    listLiveAds().catch(() => []),
    listLiveFlash(6).catch(() => []),
    listPartners().catch(() => []),
    listTrails().catch(() => []),
    listCities().catch(() => []),
    listExercises().catch(() => []),
    listHomepageCodes(),
  ]);
  const codes = codesRaw.slice(0, 3);
  const offers = offersRaw.filter((o, i, a) => a.findIndex((x) => x.title_ar === o.title_ar && x.organizations?.slug === o.organizations?.slug) === i);
  const sorted = [...home.sections].sort((a, b) => b.total - a.total);
  const full = cfg.maxSections > 0 ? sorted.slice(0, cfg.maxSections) : sorted;
  const tiles = home.sections.filter((s) => !new Set(full.map((item) => item.key)).has(s.key));
  const banner = ads.find((a) => a.placement === "banner");
  const sponsored = ads.filter((a) => a.placement === "sponsored").slice(0, 3);
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="relative isolate -mx-4 overflow-hidden rounded-b-[2rem] border-b border-white/10 bg-[radial-gradient(ellipse_at_15%_10%,rgba(212,255,0,.15),transparent_38%),radial-gradient(ellipse_at_85%_80%,rgba(168,204,24,.09),transparent_34%)] px-4 pb-10 pt-8 sm:rounded-b-[2.75rem] sm:px-8 sm:pb-16 sm:pt-12 lg:pb-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-14">
          <div className="text-right">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4ff00]/20 bg-[#d4ff00]/10 px-3 py-1.5 text-xs font-bold text-[#d4ff00] sm:text-sm"><span className="size-2 animate-pulse rounded-full bg-emerald-400 motion-reduce:animate-none" /> دليلك الرياضي من عمّان لكل الأردن</div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.25] tracking-tight sm:text-5xl lg:text-6xl">
              {cfg.heroTitle}<br /><span className="bg-gradient-to-l from-[#efffa0] via-[#d4ff00] to-[#a8cc18] bg-clip-text text-transparent">{cfg.heroAccent}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">{cfg.heroSubtitle}</p>
            <form action="/search" className="mt-8 grid gap-2 rounded-2xl border border-white/10 bg-surface/90 p-2 shadow-2xl shadow-black/20 backdrop-blur sm:grid-cols-[1fr_auto]">
              <label className="flex min-w-0 items-center gap-3 rounded-xl bg-background/70 px-4">
                <span aria-hidden className="text-xl text-[#d4ff00]">⌕</span>
                <input name="q" aria-label="بحث" placeholder="شو حاب تتمرّن؟ نادي، مدرب، ملاعب..." className="min-w-0 flex-1 bg-transparent py-4 outline-none placeholder:text-muted/80 focus:ring-0" />
              </label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <select name="city" aria-label="المدينة" defaultValue="" className="min-w-0 rounded-xl bg-background px-3 py-3 text-sm ring-1 ring-white/10 focus:ring-[#d4ff00]">
                  <option value="">كل المدن</option>
                  {cities.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
                </select>
                <button className="rounded-xl bg-[#d4ff00] text-[#151a0b] px-6 py-3 font-extrabold shadow-lg shadow-black/30 transition hover:-translate-y-0.5 hover:brightness-110">اكتشف الآن <span aria-hidden>←</span></button>
              </div>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted sm:text-sm"><span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> قارن قبل ما تشترك</span><span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> معلومات محلية</span><span className="inline-flex items-center gap-2"><span className="text-emerald-300">✓</span> تواصل مباشر</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-lg lg:me-0">
            <div aria-hidden className="absolute inset-8 rounded-full bg-[#d4ff00]/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#252c20] via-[#1b2119] to-[#10130f] p-4 shadow-2xl shadow-black/40 sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div><p className="text-xs text-muted">رحلتك الرياضية تبدأ هون</p><p className="mt-1 text-lg font-extrabold">اختار أسلوبك</p></div>
                <span className="rounded-2xl border border-[#d4ff00]/20 bg-[#d4ff00]/10 p-3 text-2xl">✦</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {TYPE_TILES.slice(0, 4).map((tile) => (
                  <Link key={tile.href} href={tile.href} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-1 hover:border-[#d4ff00]/40 hover:bg-[#d4ff00]/10">
                    <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-[#d4ff00]/10 text-2xl">{tile.icon}</span>
                    <span className="block font-extrabold">{tile.label}</span>
                    <span className="mt-1 block text-xs text-muted">{tile.description}</span>
                  </Link>
                ))}
              </div>
              <Link href="/search" className="mt-3 flex items-center justify-between rounded-2xl border border-[#d4ff00]/20 bg-[#d4ff00]/10 px-4 py-3 text-sm font-bold text-[#d4ff00] transition hover:bg-[#d4ff00]/15"><span>استكشف كل الأنشطة الرياضية</span><span aria-hidden>←</span></Link>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-black/20 p-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-lg">⌖</span><div><p className="text-sm font-bold">منطقتك، ميزانيتك، هدفك</p><p className="mt-0.5 text-xs text-muted">اكتشف خيارات أقرب لإلك بدل البحث العشوائي</p></div></div>
            </div>
            <div className="absolute -left-2 top-10 hidden -translate-x-1/4 rounded-2xl border border-white/10 bg-surface/95 px-4 py-3 shadow-xl backdrop-blur sm:block"><p className="text-xs text-muted">قرار أذكى</p><p className="mt-1 text-sm font-extrabold">قارن. اختار. انطلق.</p></div>
          </div>
        </div>
        {show.tiles && (
          <section className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-7 sm:mt-14">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-xs font-extrabold tracking-wider text-accent">GYMJO DIRECTORY</p><h2 className="mt-1 text-xl font-black sm:text-2xl">دليل الأنشطة الرياضية</h2><p className="mt-1 text-sm text-muted">اختار نوع النشاط اللي بتدور عليه.</p></div>
              <Link href="/directory" className="text-sm font-bold text-accent">كل الدليل ←</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {TYPE_TILES.map((tile) => (
                <Link key={tile.href} href={tile.href} className="group flex min-h-32 flex-col rounded-2xl border border-white/10 bg-surface/80 p-3 transition hover:-translate-y-1 hover:border-accent/50 hover:bg-accent/5 sm:p-4">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-xl">{tile.icon}</span>
                  <span className="mt-3 font-extrabold">{tile.label}</span>
                  <span className="mt-1 text-xs leading-5 text-muted">{tile.description}</span>
                  <span className="mt-auto pt-3 text-xs font-bold text-accent">استكشف ←</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>

      <section className="py-12 sm:py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-extrabold tracking-wider text-accent">MORE THAN A DIRECTORY</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">كل ميزات GymJo قدامك</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">مش بس دليل نوادي؛ أدوات ومحتوى وعروض تساعدك تتمرّن وتتابع تقدمك وتكتشف أشياء جديدة — كل قسم ظاهر هون بدون قوائم مخفية.</p></div>
          <span className="rounded-full border border-white/10 bg-surface px-3 py-1.5 text-xs font-bold text-muted">{FEATURE_TILES.length} ميزة</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {FEATURE_TILES.map((tile, index) => (
            <Link key={tile.href} href={tile.href} className="group relative flex min-h-36 flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface p-4 transition duration-200 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-black/10 sm:min-h-40 sm:p-5">
              <span aria-hidden className="absolute -left-3 -top-4 text-7xl opacity-[0.06] transition group-hover:scale-110">{tile.icon}</span>
              <span className="relative flex size-11 items-center justify-center rounded-xl bg-accent/10 text-2xl">{tile.icon}</span>
              <span className="relative mt-3 font-extrabold">{tile.label}</span>
              <span className="relative mt-1 text-xs leading-5 text-muted">{tile.description}</span>
              <span className="relative mt-auto pt-3 text-xs font-bold text-accent">افتح القسم ←</span>
              <span className="absolute bottom-0 right-0 h-1 w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>
      </section>

      {exercises.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-extrabold tracking-wider text-accent">LEARN & TRAIN</p><h2 className="mt-1 text-2xl font-black">جرّب مكتبة التمارين</h2><p className="mt-1 text-sm text-muted">شوف أسماء التمارين والعضلات المستهدفة قبل ما تدخل للقسم.</p></div>
            <Link href="/exercises" className="text-sm font-bold text-accent">كل التمارين ←</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {exercises.slice(0, 4).map((exercise) => (
              <Link key={exercise.id} href={`/exercises/${exercise.slug}`} className="rounded-2xl border border-white/10 bg-surface p-4 transition hover:border-accent/50 hover:bg-accent/5">
                <span className="inline-flex rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">{exercise.muscle_group}</span>
                <h3 className="mt-3 font-extrabold">{exercise.name_ar}</h3>
                {exercise.summary_ar && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{exercise.summary_ar}</p>}
                <p className="mt-3 text-xs font-bold text-accent">{exercise.count > 0 ? `${exercise.count} شرح من مدربين` : "شوف تفاصيل التمرين"} ←</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      {codes.length > 0 && (
        <section className="mb-12 rounded-3xl border border-[#d4ff00]/20 bg-gradient-to-l from-[#d4ff00]/[0.08] to-surface p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-extrabold tracking-wider text-accent">GYMJO EXCLUSIVE</p><h2 className="mt-1 text-2xl font-black">وفّر مع أكواد GymJo</h2><p className="mt-1 text-sm text-muted">خصومات حقيقية من أنشطة ومتاجر مشاركة — اكشف الكود واستخدمه مباشرة.</p></div>
            <Link href="/deals" className="text-sm font-bold text-accent">كل أكواد الخصم ←</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {codes.map((code) => (
              <article key={code.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-surface p-4">
                <div><h3 className="font-extrabold">{code.title_ar}</h3>{code.details_ar && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{code.details_ar}</p>}<p className="mt-2 text-xs text-muted">{code.org_name} · {code.org_city}</p></div>
                <RevealCode id={code.id} />
              </article>
            ))}
          </div>
        </section>
      )}
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
      {show.trails && trails.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex items-baseline justify-between"><h2 className="text-xl font-bold">🥾 مسارات المشي والهايكنق</h2><Link href="/trails" className="text-sm text-accent underline">كل المسارات</Link></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{trails.slice(0, 6).map((t) => <TrailCard key={t.id} t={t} />)}</div>
        </section>
      )}
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
