import type { Metadata } from "next";
import Link from "next/link";
import { SectionExplorer } from "@/components/SectionExplorer";
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
  const groups = GROUPS.map((group) => ({ ...group, links: group.links.filter((item) => known.has(item.href) || new Set<string>(["/directory", "/join"]).has(item.href)) }));
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

      <SectionExplorer groups={groups} extras={extras} />
    </main>
  );
}
