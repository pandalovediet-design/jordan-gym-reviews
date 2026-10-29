import type { Metadata } from "next";
import Link from "next/link";
import { NAV_CATALOG } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "كل الأقسام",
  description:
    "اكتشف أقسام GymJo الرياضية في مكان واحد: دليل النوادي، التمارين، العروض، المسارات والأدوات.",
};

const MORE = [
  { href: "/directory", label: "📍 دليل النوادي حسب المدينة", description: "تصفّح الأنشطة الرياضية حسب موقعك." },
  { href: "/guides", label: "📚 الأدلة والنصائح", description: "معلومات تساعدك تختار وتبدأ." },
  { href: "/join", label: "➕ سجّل نشاطك", description: "أضف ناديك أو نشاطك إلى الدليل." },
  { href: "/sponsors", label: "🤝 للرعاة والشركاء", description: "اكتشف فرص الظهور والشراكة." },
];

const DESCRIPTIONS: Record<string, string> = {
  "/search": "ابحث عن النوادي والمدربين والمنشآت الرياضية.",
  "/pink": "مساحة مخصصة لتجارب واحتياجات السيدات الرياضية.",
  "/now": "اكتشف خيارات رياضية تناسب خطتك اليوم.",
  "/awards": "تابع ترشيحات واختيارات نادي الشهر.",
  "/exercises": "تعرّف على التمارين وكيفية أدائها.",
  "/log": "سجّل نشاطك وتابع استمراريتك.",
  "/deals": "اعثر على أكواد وعروض من الأنشطة المشاركة.",
  "/no-gym": "أفكار للتمرين في البيت ومن دون اشتراك.",
  "/no-deprivation": "محتوى غذائي متوازن بعيد عن الحرمان.",
  "/rooh-w-jasad": "محتوى يجمع العافية الجسدية والروحية.",
  "/reels": "شاهد مقاطع رياضية قصيرة وملهمة.",
  "/market": "تصفّح معدات رياضية للبيع أو التبديل.",
  "/trails": "اكتشف مسارات المشي والأنشطة الخارجية.",
  "/tools": "استخدم حاسبات وأدوات تساعدك في رحلتك.",
  "/favorites": "ارجع بسهولة إلى الأنشطة التي حفظتها.",
};

const GROUPS = [
  {
    title: "اكتشف الأنشطة",
    description: "ابدأ بالعثور على المكان الرياضي المناسب لك.",
    hrefs: ["/search", "/directory", "/pink", "/now", "/awards"],
  },
  {
    title: "تمرّن واهتم بصحتك",
    description: "أدوات ومحتوى يساعدك تحافظ على نشاطك.",
    hrefs: ["/exercises", "/log", "/no-gym", "/no-deprivation", "/rooh-w-jasad", "/tools", "/trails"],
  },
  {
    title: "العروض والمجتمع",
    description: "وفّر، شارك، واحفظ الأشياء التي تهمك.",
    hrefs: ["/deals", "/market", "/reels", "/favorites", "/guides"],
  },
  {
    title: "للأنشطة والشركاء",
    description: "خلّي نشاطك الرياضي جزءاً من دليل GymJo.",
    hrefs: ["/join", "/sponsors"],
  },
];

const ALL_LINKS = [...NAV_CATALOG, ...MORE];
const CARD_STYLE =
  "group flex h-full min-h-32 flex-col rounded-2xl border border-white/10 bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/10 focus-visible:border-accent";

export default function Sections() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <header className="relative mb-9 overflow-hidden rounded-3xl border border-white/10 bg-surface p-6 sm:p-9">
        <div aria-hidden="true" className="pointer-events-none absolute -left-12 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative">
          <p className="mb-3 text-xs font-extrabold tracking-[0.2em] text-accent">GYMJO · YOUR FITNESS GUIDE</p>
          <h1 className="max-w-2xl text-3xl font-black leading-tight sm:text-4xl">كل رحلتك الرياضية، <span className="text-accent">بمكان واحد.</span></h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            دليل النوادي والأنشطة الرياضية في الأردن، بالإضافة إلى أدوات ومحتوى وعروض تساعدك تلاقي اللي بناسبك.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/search" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-extrabold text-accent-foreground transition hover:brightness-95">
              اكتشف الأنشطة <span aria-hidden="true" className="ms-2">←</span>
            </Link>
            <Link href="/join" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-sm font-bold transition hover:border-accent/50">
              أضف نشاطك مجاناً
            </Link>
          </div>
        </div>
      </header>

      <div className="mb-7 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black sm:text-2xl">استكشف أقسام GymJo</h2>
          <p className="mt-1 text-sm text-muted">رتّبناها حسب احتياجك، وكل قسم ظاهر مباشرة بدون قوائم مخفية.</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-muted">{ALL_LINKS.length} قسم وأداة</span>
      </div>

      <div className="space-y-9">
        {GROUPS.map((group, index) => {
          const links = group.hrefs
            .map((href) => ALL_LINKS.find((item) => item.href === href))
            .filter((item): item is (typeof ALL_LINKS)[number] => Boolean(item));

          return (
            <section key={group.title} aria-labelledby={`section-group-${index}`}>
              <div className="mb-4 flex items-start gap-3">
                <span aria-hidden="true" className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-black text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 id={`section-group-${index}`} className="text-lg font-extrabold">{group.title}</h3>
                  <p className="mt-0.5 text-sm text-muted">{group.description}</p>
                </div>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={CARD_STYLE}>
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-extrabold leading-7">{item.label}</span>
                        <span aria-hidden="true" className="mt-1 text-lg text-accent transition-transform group-hover:-translate-x-1">←</span>
                      </span>
                      <span className="mt-2 text-sm leading-6 text-muted">
                        {("description" in item && item.description) || DESCRIPTIONS[item.href] || "اكتشف المزيد من خدمات GymJo."}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
