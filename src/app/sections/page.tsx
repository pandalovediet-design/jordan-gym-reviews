import type { Metadata } from "next";
import Link from "next/link";
import { NAV_CATALOG } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "كل الأقسام",
  description:
    "اكتشف أقسام GYMJO الرياضية في مكان واحد: دليل النوادي، التمارين، العروض، المسارات والأدوات.",
};

const MORE = [
  { href: "/directory", label: "📍 الدليل حسب المدينة", description: "تصفّح كل الأنشطة الرياضية حسب النوع والمدينة." },
  { href: "/search?type=gym", label: "🏋️ النوادي الرياضية", description: "قارن النوادي والأسعار والمرافق قبل الاشتراك." },
  { href: "/search?type=independent_coach", label: "🧑‍🏫 المدربون الشخصيون", description: "اعثر على مدرب يناسب هدفك وموقعك." },
  { href: "/search?type=sports_facility", label: "⚽ الملاعب والمنشآت", description: "اكتشف الملاعب والمنشآت الرياضية القريبة." },
  { href: "/search?type=nutritionist", label: "🥗 أخصائيو التغذية", description: "ابحث عن مختصين لمساعدتك في أهدافك الغذائية." },
  { href: "/search?type=store", label: "🛍️ المتاجر الرياضية", description: "تصفّح متاجر المعدات والمنتجات الرياضية." },
  { href: "/search?type=sports_health", label: "🩺 العلاج والطب الرياضي", description: "اعثر على خدمات الرعاية والتأهيل الرياضي." },
  { href: "/guides", label: "📚 الأدلة والنصائح", description: "معلومات تساعدك تختار وتبدأ." },
  { href: "/join", label: "➕ أضف ناديك", description: "سجّل ناديك وأدِر صفحته بنفسك، مجاناً." },
  { href: "/sponsors", label: "🤝 للرعاة والشركاء", description: "اكتشف فرص الظهور والشراكة." },
];

const DESCRIPTIONS: Record<string, string> = {
  "/search": "ابحث عن النوادي والمدربين والمنشآت الرياضية.",
  "/pink": "مساحة مخصصة لتجارب واحتياجات السيدات الرياضية.",
  "/now": "اكتشف خيارات رياضية تناسب خطتك اليوم.",
  "/awards": "تابع ترشيحات واختيارات نادي الشهر.",
  "/exercises": "تعرّف على التمارين وكيفية أدائها.",
  "/log": "سجّل نشاطك وتابع استمراريتك.",
  "/food": "سجّل وجباتك بضغطة بدون عدّ سعرات.",
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
    hrefs: ["/directory", "/search?type=gym", "/search?type=independent_coach", "/search?type=sports_facility", "/search?type=nutritionist", "/search?type=store", "/search?type=sports_health", "/pink"],
  },
  {
    title: "تمرّن واهتم بصحتك",
    description: "أدوات ومحتوى يساعدك تحافظ على نشاطك.",
    hrefs: ["/exercises", "/log", "/food", "/no-gym", "/no-deprivation", "/rooh-w-jasad", "/tools", "/trails"],
  },
  {
    title: "العروض والمجتمع",
    description: "وفّر، شارك، واحفظ الأشياء التي تهمك.",
    hrefs: ["/deals", "/market", "/reels", "/favorites", "/guides"],
  },
  {
    title: "للأنشطة والشركاء",
    description: "خلّي نشاطك الرياضي جزءاً من دليل GYMJO.",
    hrefs: ["/join", "/sponsors"],
  },
];

const ALL_LINKS = [...NAV_CATALOG, ...MORE];
// Labels in the catalog carry a leading emoji; the index is plain text.
const plain = (label: string) => label.replace(/^[^\p{L}]+/u, "").trim();

export default function Sections() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">كل الأقسام</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">الدليل، وكل الأدوات والمحتوى والعروض اللي حواليه، بصفحة وحدة.</p>
        </div>
        <Link href="/search" className="inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-accent px-6 font-semibold text-accent-foreground">دوّر بالدليل</Link>
      </header>

      <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
        {GROUPS.map((group, index) => {
          const links = group.hrefs
            .map((href) => ALL_LINKS.find((item) => item.href === href))
            .filter((item): item is (typeof ALL_LINKS)[number] => Boolean(item));

          return (
            <section key={group.title} aria-labelledby={`section-group-${index}`}>
              <h2 id={`section-group-${index}`} className="border-b-2 border-foreground pb-2 text-2xl font-bold">{group.title}</h2>
              <ul className="divide-y divide-line">
                {links.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="group block py-3.5">
                      <span className="block font-semibold underline-offset-4 group-hover:text-accent group-hover:underline">{plain(item.label)}</span>
                      <span className="mt-0.5 block text-sm leading-6 text-muted">
                        {("description" in item && item.description) || DESCRIPTIONS[item.href] || "اكتشف المزيد من خدمات GYMJO."}
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
