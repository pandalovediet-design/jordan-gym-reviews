"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Platform-owner navigation in two levels: a short row of groups, and under it only the pages of the
 * group you are in. Every admin page is still one tap away; there are just fewer pills on screen.
 */
const GROUPS = [
  { label: "🏠 الرئيسية", tabs: [{ href: "/admin", label: "نظرة عامة" }] },
  {
    label: "🏋️ الأنشطة",
    tabs: [
      { href: "/admin/orgs", label: "الأنشطة" },
      { href: "/admin/outreach", label: "📞 التواصل والاستلام" },
      { href: "/admin/categories", label: "التصنيفات" },
      { href: "/admin/products", label: "المنتجات" },
      { href: "/admin/reports", label: "البلاغات" },
      { href: "/admin/users", label: "المستخدمون" },
    ],
  },
  {
    label: "💰 الدخل",
    tabs: [
      { href: "/admin/subscriptions", label: "الاشتراكات" },
      { href: "/admin/ads", label: "الإعلانات" },
      { href: "/admin/flash", label: "الفلاش" },
      { href: "/admin/partners", label: "الشركاء" },
      { href: "/admin/leads", label: "طلبات الرعاة" },
    ],
  },
  {
    label: "📚 المحتوى",
    tabs: [
      { href: "/admin/exercises", label: "التمارين" },
      { href: "/admin/videos", label: "الفيديو" },
      { href: "/admin/home", label: "من غير جيم" },
      { href: "/admin/nutrition", label: "من غير حرمان" },
      { href: "/admin/series", label: "سلاسل جاهزة" },
      { href: "/admin/trails", label: "المسارات" },
      { href: "/admin/market", label: "سوق المعدات" },
    ],
  },
  { label: "⚙️ الإعدادات", tabs: [{ href: "/admin/settings", label: "إعدادات الموقع" }] },
];

const matches = (path: string, href: string) => path === href || (href !== "/admin" && path.startsWith(href + "/"));

export function AdminTabs() {
  const path = usePathname();
  const current = GROUPS.find((g) => g.tabs.some((t) => matches(path, t.href))) ?? GROUPS[0];
  const pill = "whitespace-nowrap rounded-full px-4 py-1.5 ring-1 ring-white/10";
  return (
    <div className="mx-auto max-w-5xl space-y-2 px-4 pt-6 text-sm">
      <nav aria-label="أقسام لوحة صاحب المنصة" className="flex gap-2 overflow-x-auto [scrollbar-width:none] md:flex-wrap">
        {GROUPS.map((g) => (
          <Link key={g.label} href={g.tabs[0].href} aria-current={g === current ? "true" : undefined}
            className={`${pill} ${g === current ? "bg-accent font-bold text-accent-foreground" : "bg-surface hover:ring-accent"}`}>{g.label}</Link>
        ))}
      </nav>
      {current.tabs.length > 1 && (
        <nav aria-label={current.label} className="flex gap-2 overflow-x-auto border-t border-white/10 pt-2 text-xs [scrollbar-width:none] md:flex-wrap">
          {current.tabs.map((t) => (
            <Link key={t.href} href={t.href} aria-current={matches(path, t.href) ? "page" : undefined}
              className={`${pill} ${matches(path, t.href) ? "bg-white/15 font-bold text-foreground" : "text-muted hover:text-foreground"}`}>{t.label}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
