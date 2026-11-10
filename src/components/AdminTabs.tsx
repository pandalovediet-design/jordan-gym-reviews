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
      { href: "/admin/leads", label: "الطلبات" },
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
  { label: "⚙️ الإعدادات", tabs: [{ href: "/admin/settings", label: "إعدادات الموقع" }, { href: "/admin/markets", label: "🌍 الدول والمدن" }] },
];

const matches = (path: string, href: string) => path === href || (href !== "/admin" && path.startsWith(href + "/"));
const navLink = "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 py-2 ring-1 ring-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

export function AdminTabs() {
  const path = usePathname();
  const current = GROUPS.find((g) => g.tabs.some((t) => matches(path, t.href))) ?? GROUPS[0];
  return (
    <div className="mx-auto max-w-5xl space-y-2 px-4 pt-6 text-sm">
      <nav aria-label="أقسام لوحة صاحب المنصة" className="flex snap-x gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:thin] md:flex-wrap">
        {GROUPS.map((g) => (
          <Link key={g.label} href={g.tabs[0].href} aria-current={g === current ? "true" : undefined}
            className={`${navLink} snap-start ${g === current ? "bg-accent font-bold text-accent-foreground" : "bg-surface hover:ring-accent"}`}>{g.label}</Link>
        ))}
      </nav>
      {current.tabs.length > 1 && (
        <nav aria-label={current.label} className="flex snap-x gap-2 overflow-x-auto overscroll-x-contain border-t border-white/10 pt-2 pb-1 text-xs [scrollbar-width:thin] md:flex-wrap">
          {current.tabs.map((t) => (
            <Link key={t.href} href={t.href} aria-current={matches(path, t.href) ? "page" : undefined}
              className={`${navLink} snap-start ${matches(path, t.href) ? "bg-accent/15 font-bold text-accent" : "text-muted hover:text-foreground"}`}>{t.label}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
