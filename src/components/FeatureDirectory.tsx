import Link from "next/link";
import { NAV_CATALOG } from "@/lib/site-settings";

const GROUPS = [
  {
    title: "اكتشف وتابع",
    description: "أماكن مميزة وأفكار جديدة لتضل قريب من عالم الرياضة.",
    links: ["/pink", "/now", "/awards", "/trails"],
  },
  {
    title: "تمارين ونمط حياة",
    description: "مصادر تساعدك تتحرك وتتمرّن بالطريقة اللي بتناسبك.",
    links: ["/exercises", "/log", "/no-gym", "/no-deprivation", "/rooh-w-jasad"],
  },
  {
    title: "أدوات ومجتمع",
    description: "وفّر، احسب، شارك واكتشف المزيد من خدمات GymJo.",
    links: ["/deals", "/reels", "/market", "/tools", "/favorites"],
  },
];

const DETAILS: Record<string, { icon: string; title: string; description: string }> = {
  "/pink": { icon: "💗", title: "أماكن نسائية", description: "أماكن رياضية مخصصة للنساء" },
  "/now": { icon: "⏱️", title: "هسا", description: "اكتشف الخيارات المتاحة هسا" },
  "/awards": { icon: "🏆", title: "نادي الشهر", description: "تابع نادي الشهر واكتشف المميز" },
  "/trails": { icon: "🥾", title: "المسارات", description: "مسارات للمشي والهايكنق" },
  "/exercises": { icon: "🏋️", title: "التمارين", description: "أفكار وتمارين رياضية" },
  "/log": { icon: "🔥", title: "سجل تمريني", description: "احتفظ بسجل تمارينك" },
  "/no-gym": { icon: "🏠", title: "من غير جيم", description: "تمارين وحركة من غير جيم" },
  "/no-deprivation": { icon: "🥗", title: "من غير حرمان", description: "أفكار أكل متوازن من غير حرمان" },
  "/rooh-w-jasad": { icon: "🌿", title: "روح وجسد", description: "مساحة للصحة والتوازن" },
  "/deals": { icon: "🎟️", title: "أكواد خصم", description: "عروض وأكواد خصم" },
  "/reels": { icon: "🎬", title: "ريلز", description: "محتوى رياضي سريع" },
  "/market": { icon: "🔄", title: "سوق المعدات", description: "معدات رياضية للبيع والتبادل" },
  "/tools": { icon: "🧮", title: "الحاسبة", description: "حاسبات وأدوات مفيدة" },
  "/favorites": { icon: "❤️", title: "المفضلة", description: "ارجع للأماكن اللي حفظتها" },
};

export function FeatureDirectory() {
  return (
    <section aria-labelledby="gymjo-features-title" className="py-10 sm:py-14">
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-black tracking-[0.16em] text-[#21834f]">MORE TO EXPLORE · GYMJO</p>
          <h2 id="gymjo-features-title" className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">كل اللي بتحبه بالرياضة، بمكان واحد</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted sm:text-base">الدليل هو البداية — واستكشف كمان الأدوات والمحتوى والميزات اللي بتسهّل عليك رحلتك الرياضية.</p>
        </div>
        <Link href="/sections" className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-[#cfe4d1] bg-[#f3f8ee] px-4 py-2.5 text-sm font-extrabold text-[#21834f] transition hover:border-[#91c9a1] hover:bg-[#e8f4e8]">
          عرض كل الأقسام <span aria-hidden>←</span>
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {GROUPS.map((group, index) => (
          <div key={group.title} className="rounded-3xl border border-[#e1ebe0] bg-surface p-4 shadow-sm sm:p-5">
            <div className="mb-4">
              <span className="mb-2 inline-flex size-9 items-center justify-center rounded-xl bg-[#e8f4e8] text-sm font-black text-[#21834f]">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="text-lg font-black text-foreground">{group.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{group.description}</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {group.links.map((href) => {
                const item = NAV_CATALOG.find((entry) => entry.href === href);
                if (!item) return null;
                return (
                  <Link key={href} href={href} className="group flex min-h-[66px] items-center gap-3 rounded-2xl border border-[#e7eee5] bg-background px-3 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-[#9acda4] hover:bg-[#f5faf2] dark:border-[#344454] dark:hover:border-[#4fbd78] dark:hover:bg-[#243a30]">
                    <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f4e8] text-xl">{DETAILS[href].icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold text-foreground">{DETAILS[href].title}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted">{DETAILS[href].description}</span>
                    </span>
                    <span aria-hidden className="text-sm text-[#21834f] transition-transform group-hover:-translate-x-1">←</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
