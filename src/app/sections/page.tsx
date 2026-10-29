import type { Metadata } from "next";
import Link from "next/link";
import { NAV_CATALOG } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "كل الأقسام والميزات | GymJo",
  description: "استكشف أقسام GymJo الرياضية وأدوات التمرين والعروض والمحتوى في مكان واحد.",
};

const GROUPS = [
  {
    title: "الدليل والاكتشاف",
    description: "ابدأ بالعثور على المكان أو النشاط الرياضي المناسب إلك.",
    accent: "bg-[#e8f4e8] text-[#21834f]",
    links: [
      { href: "/search", icon: "🔎", title: "ابحث عن نشاط", description: "نوادي ومدربين ومرافق رياضية" },
      { href: "/directory", icon: "📍", title: "الدليل حسب المدينة", description: "اكتشف الأنشطة القريبة منك" },
      { href: "/pink", icon: "💗", title: "أماكن نسائية", description: "خيارات رياضية مخصصة للنساء" },
      { href: "/join", icon: "➕", title: "سجّل نشاطك", description: "أضف ناديك أو مركزك للدليل" },
    ],
  },
  {
    title: "التمارين ونمط الحياة",
    description: "أفكار تساعدك تضل نشيط وتبني روتين يناسبك.",
    accent: "bg-[#e8f4e8] text-[#21834f]",
    links: [
      { href: "/exercises", icon: "🏋️", title: "التمارين", description: "أفكار وتمارين رياضية" },
      { href: "/log", icon: "🔥", title: "سجل تمريني", description: "تابع تمارينك وتقدمك" },
      { href: "/no-gym", icon: "🏠", title: "من غير جيم", description: "تحرّك وتمرّن بأي مكان" },
      { href: "/no-deprivation", icon: "🥗", title: "من غير حرمان", description: "أفكار غذائية متوازنة" },
      { href: "/rooh-w-jasad", icon: "🌿", title: "روح وجسد", description: "مساحة للصحة والتوازن" },
    ],
  },
  {
    title: "اكتشف أكثر",
    description: "محتوى وأدوات وفرص إضافية من عالم GymJo.",
    accent: "bg-[#e8f4e8] text-[#21834f]",
    links: [
      { href: "/now", icon: "⏱️", title: "هسا", description: "اكتشف الخيارات المتاحة" },
      { href: "/awards", icon: "🏆", title: "نادي الشهر", description: "تابع النوادي المميزة" },
      { href: "/trails", icon: "🥾", title: "مسارات المشي", description: "مسارات للمشي والهايكنق" },
      { href: "/deals", icon: "🎟️", title: "أكواد الخصم", description: "عروض تساعدك توفّر" },
      { href: "/reels", icon: "🎬", title: "ريلز رياضية", description: "محتوى سريع وملهم" },
      { href: "/market", icon: "🔄", title: "سوق المعدات", description: "معدات رياضية للبيع والتبادل" },
      { href: "/tools", icon: "🧮", title: "أدوات وحاسبات", description: "أدوات مفيدة لرحلتك الرياضية" },
      { href: "/favorites", icon: "❤️", title: "المفضلة", description: "احفظ الأماكن وارجعلها بسهولة" },
    ],
  },
];

const MORE = [
  { href: "/guides", icon: "📚", title: "أدلة رياضية", description: "معلومات تساعدك تختار" },
  { href: "/sponsors", icon: "🤝", title: "للرعاة والشركاء", description: "تعرّف على فرص التعاون" },
];

export default function Sections() {
  const known = new Set<string>(NAV_CATALOG.map((item) => item.href));
  const groups = GROUPS.map((group) => ({ ...group, links: group.links.filter((item) => known.has(item.href) || ["/directory", "/join"].includes(item.href)) }));
  const extras = MORE.filter((item) => !known.has(item.href));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="relative mb-10 overflow-hidden rounded-[2rem] bg-[#f3f8ee] px-5 py-8 text-[#18372a] sm:px-9 sm:py-11">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[#21834f] shadow-sm"><span aria-hidden>🐼</span> GYMJO · دليل الرياضة في الأردن</span>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">كل اللي بتدور عليه بالرياضة، <span className="text-[#21834f]">بمكان واحد</span></h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#617568] sm:text-base">من اكتشاف النوادي والمراكز، لأفكار التمرين والأدوات والعروض — تصفّح اللي بناسبك ووصل إله بخطوة.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/search" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#21834f] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#17683d]">ابدأ البحث <span aria-hidden className="mr-2">←</span></Link>
            <Link href="/directory" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#cfe2cd] bg-white px-5 py-3 text-sm font-extrabold text-[#21834f] transition hover:bg-[#e8f4e8]">تصفّح حسب المدينة</Link>
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute -left-5 -top-8 select-none text-[8rem] opacity-[0.09] sm:left-8 sm:text-[11rem]">🐼</div>
      </section>

      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground">استكشف أقسام GymJo</h2>
          <p className="mt-1 text-sm leading-6 text-muted">مرتّبة حسب اللي بدك تعمله، مش مجرد قائمة روابط.</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#e8f4e8] px-3 py-1.5 text-xs font-extrabold text-[#21834f]">{groups.reduce((sum, group) => sum + group.links.length, 0) + extras.length} قسم</span>
      </div>

      <div className="space-y-10">
        {groups.map((group, index) => (
          <section key={group.title} aria-labelledby={`section-group-${index}`}>
            <div className="mb-4">
              <h2 id={`section-group-${index}`} className="text-lg font-black text-foreground sm:text-xl">{group.title}</h2>
              <p className="mt-1 text-sm text-muted">{group.description}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.links.map((item) => (
                <Link key={item.href} href={item.href} className="group flex min-h-[112px] items-start gap-3 rounded-2xl border border-[#e1ebe0] bg-surface p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#9acda4] hover:shadow-md dark:border-[#344454] dark:hover:border-[#4fbd78]">
                  <span aria-hidden className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl ${group.accent}`}>{item.icon}</span>
                  <span className="min-w-0 flex-1 pt-0.5">
                    <span className="block font-extrabold text-foreground">{item.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-muted">{item.description}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#21834f]">استكشف <span aria-hidden className="transition-transform group-hover:-translate-x-1">←</span></span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {extras.length > 0 && (
        <section className="mt-10 border-t border-border pt-8">
          <h2 className="mb-4 text-lg font-black text-foreground">للمهتمين بالتعاون</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {extras.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-[#9acda4]">
                <span aria-hidden className="flex size-11 items-center justify-center rounded-xl bg-[#e8f4e8] text-xl">{item.icon}</span>
                <span><span className="block font-extrabold text-foreground">{item.title}</span><span className="mt-1 block text-sm text-muted">{item.description}</span></span>
                <span aria-hidden className="mr-auto text-[#21834f]">←</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
