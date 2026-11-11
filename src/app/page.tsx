import Link from "next/link";
import { FlashStrip } from "@/components/FlashStrip";
import { OrgCard } from "@/components/OrgCard";
import { TrailCard } from "@/components/TrailCard";
import { adImageUrl, listLiveAds } from "@/lib/ads";
import { AdImpressions } from "@/components/AdImpressions";
import { listActiveOffers, listCities, listHomeSections, listLiveFlash, listPartners, listTrails } from "@/lib/queries";
import { getSiteSettings } from "@/lib/site-settings";
import { listExercises } from "@/lib/exercises";
import { createPublicClient } from "@/lib/supabase/public";
import { RevealCode } from "@/components/RevealCode";

// The eight kinds of place in the directory. Text only: the label is the icon.
const TYPE_TILES = [
  { href: "/search?type=gym", label: "نوادي", description: "حديد، لياقة، فنون قتالية" },
  { href: "/search?type=sports_facility", label: "ملاعب ومسابح", description: "خماسي، بادل، سباحة، حدائق" },
  { href: "/search?type=independent_coach", label: "مدربين", description: "شخصي أو أونلاين" },
  { href: "/pink", label: "للنساء", description: "أماكن وأوقات خاصة بالسيدات", pink: true },
  { href: "/search?type=nutritionist", label: "تغذية", description: "أخصائيين مرخّصين" },
  { href: "/search?type=healthy_food", label: "أكل صحي", description: "مطاعم ومطابخ ووجبات اشتراك" },
  { href: "/search?type=store", label: "متاجر", description: "مكملات، ملابس، أجهزة" },
  { href: "/search?type=sports_health", label: "علاج رياضي", description: "علاج طبيعي وتأهيل إصابات" },
];

// Everything else the site offers, grouped by what the visitor wants to do.
const MORE_GROUPS = [
  { title: "تمرّن", links: [
    { href: "/exercises", label: "مكتبة التمارين", description: "كل تمرين وطريقة أدائه" },
    { href: "/log", label: "سجل تمريني", description: "سجّل تمرينك وتابع استمراريتك" },
    { href: "/challenges", label: "التحديات", description: "تحدي جديد كل أسبوع" },
    { href: "/no-gym", label: "من غير جيم", description: "تمارين بالبيت بأدوات بسيطة" },
    { href: "/tools", label: "الحاسبات", description: "سعرات، بروتين، كتلة عضلية" },
  ] },
  { title: "كُل صح", links: [
    { href: "/no-deprivation", label: "من غير حرمان", description: "أكل متوازن بدون تعقيد" },
    { href: "/food", label: "سجل أكلي", description: "وجباتك بضغطة، بدون عدّ سعرات" },
    { href: "/rooh-w-jasad", label: "روح وجسد", description: "مواقيت الصلاة، قرآن، وتسبيح" },
  ] },
  { title: "اكتشف", links: [
    { href: "/now", label: "فاتح هسا", description: "الأماكن المفتوحة بهاللحظة" },
    { href: "/deals", label: "أكواد الخصم", description: "خصومات من نوادي ومتاجر" },
    { href: "/awards", label: "نادي الشهر", description: "الترشيحات والفائزين" },
    { href: "/trails", label: "المسارات", description: "مشي وهايكنق بالأردن" },
    { href: "/reels", label: "ريلز رياضية", description: "مقاطع من مدربين ونوادي" },
    { href: "/market", label: "سوق المعدات", description: "بيع وبدّل معداتك" },
    { href: "/favorites", label: "المفضلة", description: "الأماكن اللي حفظتها" },
  ] },
];

/** Section heading with an optional "see all" link on the far side. */
function Head({ title, note, href, more }: { title: string; note?: string; href?: string; more?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        {note && <p className="mt-1 text-sm leading-6 text-muted">{note}</p>}
      </div>
      {href && <Link href={href} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline">{more ?? "عرض الكل"}</Link>}
    </div>
  );
}

const AD_TAG = "absolute start-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white";

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
  const placeCount = home.sections.reduce((n, sec) => n + sec.total, 0);
  return (
    <div>
      {/* Hero: the one ink block on the page. The panda is the only loud element. */}
      <section className="ink relative isolate overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-end gap-x-10 px-4 pt-6 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:pt-12">
          <div className="pb-9 lg:pb-16">
            <h1 className="text-[2.75rem] font-extrabold leading-[1.12] sm:text-6xl lg:text-7xl">لاقي ناديك<br />قبل ما تدفع</h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-muted sm:text-lg">
              الأسعار والدوام والصور لنوادي ومدربين وملاعب الأردن، وزر واتساب بيوصلك لصاحب المكان مباشرة.
            </p>
            <form action="/search" className="rim mt-7 flex flex-col gap-2 rounded-2xl bg-white p-2 text-[#121613] sm:flex-row sm:items-center">
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input name="q" aria-label="بحث" placeholder="اسم نادي، منطقة، أو رياضة" className="min-w-0 flex-1 bg-transparent py-3 outline-none placeholder:text-[#5b655e]" />
              </label>
              <div className="flex gap-2">
                <select name="city" aria-label="المدينة" defaultValue="" className="min-h-12 min-w-0 flex-1 rounded-xl bg-[#f3f4f0] px-3 text-sm sm:flex-none">
                  <option value="">كل المدن</option>
                  {cities.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
                </select>
                <button className="min-h-12 rounded-xl bg-[#121613] px-7 font-display text-lg font-bold text-lime transition-colors hover:bg-black">دوّر</button>
              </div>
            </form>
            <ul className="mt-5 flex flex-wrap gap-2 text-sm">
              {[["/now", "فاتح هسا"], ["/search?trial=1", "فيه يوم تجريبي"], ["/pink", "للنساء"], ["/directory", "حسب المدينة"]].map(([href, label]) => (
                <li key={href}><Link href={href} className="inline-flex min-h-10 items-center rounded-full px-4 font-semibold ring-1 ring-line transition-colors hover:bg-lime hover:text-ink hover:ring-lime">{label}</Link></li>
              ))}
            </ul>
            {placeCount > 0 && <p className="mt-6 text-sm text-muted"><span className="font-display text-xl font-bold text-accent tabular-nums">{placeCount}</span> مكان رياضي بالدليل لحد اليوم</p>}
          </div>
          <div aria-hidden className="relative -order-1 mx-auto w-52 sm:w-72 lg:order-none lg:w-full lg:max-w-lg lg:self-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/panda.webp" alt="" width={900} height={900} fetchPriority="high" className="h-auto w-full [mask-image:radial-gradient(closest-side,black_78%,transparent)]" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-4 pt-10 sm:px-6 sm:space-y-16 sm:pt-14">
        {show.tiles && (
          <section>
            <Head title="شو بتدوّر؟" href="/directory" more="كل الدليل" />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TYPE_TILES.map((tile) => (
                <li key={tile.href}>
                  <Link href={tile.href} className={`flex h-full flex-col justify-between gap-3 rounded-2xl bg-surface p-4 ring-1 transition-colors sm:p-5 ${tile.pink ? "ring-pink-500/40 hover:bg-pink-600 hover:text-white" : "ring-line hover:bg-ink hover:text-white"}`}>
                    <span className={`font-display text-xl font-bold sm:text-2xl ${tile.pink ? "text-pink-600 [a:hover_&]:text-white" : ""}`}>{tile.label}</span>
                    <span className="text-xs leading-5 opacity-70">{tile.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <AdImpressions ids={[...(show.banner && banner ? [banner.id] : []), ...(show.sponsored ? sponsored.map((a) => a.id) : [])]} />
        {show.banner && banner && (
          <a href={`/a/${banner.id}`} rel="sponsored noopener" className="relative block overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
            {banner.image_path && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={adImageUrl(banner.image_path)!} alt={banner.title} className="aspect-[16/6] w-full object-cover" />
            )}
            <span className={AD_TAG}>إعلان</span>
            <div className="p-4"><p className="font-bold">{banner.title}</p>{banner.subtitle && <p className="text-sm text-muted">{banner.subtitle}</p>}</div>
          </a>
        )}

        {show.flash && <FlashStrip items={flash} />}

        {show.sections && (home.sections.length === 0 ? (
          <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-line">
            <p className="font-display text-xl font-bold">ما في أماكن منشورة لسا</p>
            <p className="mt-2 text-sm text-muted">عندك نادي أو ملعب؟ ضيفه وخلّيه أول واحد بالدليل.</p>
            <Link href="/join" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-accent-foreground">أضف ناديك</Link>
          </div>
        ) : full.map((sec) => (
          <section key={sec.key}>
            <Head title={sec.title} href={sec.href} more={`عرض الكل (${sec.total})`} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sec.items.map((o) => <OrgCard key={o.id} org={o} />)}</div>
          </section>
        )))}

        {show.sections && tiles.length > 0 && (
          <section>
            <Head title="أقسام ثانية" />
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {tiles.map((sec) => (
                <li key={sec.key}>
                  <Link href={sec.href} className="flex min-h-12 items-center justify-between gap-2 rounded-xl bg-surface px-4 py-2 text-sm ring-1 ring-line transition-colors hover:ring-foreground">
                    <span className="font-semibold">{sec.title}</span><span className="text-xs text-muted tabular-nums">{sec.total}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {show.pink && home.pink.items.length > 0 && (
          <section className="rounded-3xl bg-pink-500/10 p-4 ring-1 ring-pink-500/30 sm:p-6">
            <Head title="Pink Zone" note="أماكن خاصة بالنساء فقط." href="/search?women=only" more={`عرض الكل (${home.pink.total})`} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{home.pink.items.map((o) => <OrgCard key={o.id} org={o} />)}</div>
          </section>
        )}

        {show.sponsored && sponsored.length > 0 && (
          <section>
            <Head title="مموّل" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sponsored.map((a) => (
                <a key={a.id} href={`/a/${a.id}`} rel="sponsored noopener" className="relative block overflow-hidden rounded-2xl bg-surface ring-1 ring-line transition-colors hover:ring-foreground">
                  {a.image_path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={adImageUrl(a.image_path)!} alt={a.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  )}
                  <span className={AD_TAG}>إعلان</span>
                  <div className="p-5"><h3 className="font-bold">{a.title}</h3>{a.subtitle && <p className="mt-1 text-sm text-muted">{a.subtitle}</p>}</div>
                </a>
              ))}
            </div>
          </section>
        )}

        {show.offers && offers.length > 0 && (
          <section>
            <Head title="عروض ودورات" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((o) => (
                <Link key={o.id} href={`/g/${o.organizations!.slug}`} className="rounded-2xl bg-surface p-5 ring-1 ring-line transition-colors hover:ring-foreground">
                  <p className="text-xs font-semibold text-accent">{o.kind === "course" ? "دورة" : o.discount_percent ? `خصم ${o.discount_percent}%` : "عرض"}</p>
                  <h3 className="mt-1 text-lg font-bold">{o.title_ar}</h3>
                  <p className="mt-1 text-sm text-muted">{o.organizations!.name_ar}، {o.organizations!.city}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {codes.length > 0 && (
          <section>
            <Head title="أكواد خصم" note="اكشف الكود واستعمله عند صاحب المكان." href="/deals" more="كل الأكواد" />
            <div className="grid gap-3 sm:grid-cols-3">
              {codes.map((code) => (
                <article key={code.id} className="flex flex-col justify-between gap-4 rounded-2xl bg-surface p-4 ring-1 ring-line">
                  <div><h3 className="text-lg font-bold">{code.title_ar}</h3>{code.details_ar && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{code.details_ar}</p>}<p className="mt-2 text-xs text-muted">{code.org_name}، {code.org_city}</p></div>
                  <RevealCode id={code.id} />
                </article>
              ))}
            </div>
          </section>
        )}

        {show.trails && trails.length > 0 && (
          <section>
            <Head title="مسارات المشي والهايكنق" href="/trails" more="كل المسارات" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{trails.slice(0, 6).map((t) => <TrailCard key={t.id} t={t} />)}</div>
          </section>
        )}

        {exercises.length > 0 && (
          <section>
            <Head title="من مكتبة التمارين" href="/exercises" more="كل التمارين" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {exercises.slice(0, 4).map((exercise) => (
                <Link key={exercise.id} href={`/exercises/${exercise.slug}`} className="rounded-2xl bg-surface p-4 ring-1 ring-line transition-colors hover:ring-foreground">
                  <span className="text-xs font-semibold text-accent">{exercise.muscle_group}</span>
                  <h3 className="mt-1 text-lg font-bold">{exercise.name_ar}</h3>
                  {exercise.summary_ar && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{exercise.summary_ar}</p>}
                  {exercise.count > 0 && <p className="mt-3 text-xs text-muted">{exercise.count} شرح من مدربين</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Everything else on the site, as a plain index instead of a wall of cards. */}
        <section>
          <Head title="مش بس دليل" note="أدوات ومحتوى مجاني بيمشي معك بعد ما تلاقي ناديك." href="/sections" more="كل الأقسام" />
          <div className="grid gap-x-10 gap-y-8 md:grid-cols-3">
            {MORE_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="border-b-2 border-foreground pb-2 text-xl font-bold">{group.title}</h3>
                <ul className="divide-y divide-line">
                  {group.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="group flex min-h-14 items-baseline justify-between gap-4 py-3">
                        <span className="font-semibold underline-offset-4 group-hover:text-accent group-hover:underline">{l.label}</span>
                        <span className="text-end text-xs leading-5 text-muted">{l.description}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* For owners: the directory grows when they claim their page. */}
        <section className="ink rim flex flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">عندك نادي أو ملعب أو متجر؟</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-muted">صفحتك مجانية: حط أسعارك وصورك ودوامك، والزبون بيحكي معك واتساب مباشرة.</p>
          </div>
          <Link href="/join" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-accent px-7 font-display text-lg font-bold text-accent-foreground">أضف ناديك</Link>
        </section>

        {show.partners && partners.length > 0 && (
          <section>
            <h2 className="mb-4 text-center text-sm font-semibold text-muted">شركاء المنصة</h2>
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
    </div>
  );
}
