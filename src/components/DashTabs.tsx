"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashTabs({ id, showMembers, newInquiries = 0 }: { id: string; showMembers: boolean; newInquiries?: number }) {
  const path = usePathname();
  const tabs = [
    { href: `/dashboard/${id}/overview`, label: "نظرة عامة" },
    { href: `/dashboard/${id}`, label: "✏️ تعديل صفحتي" },
    { href: `/dashboard/${id}/posts`, label: "📣 المنشورات" },
    { href: `/dashboard/${id}/inquiries`, label: "الاستفسارات", count: newInquiries },
    { href: `/dashboard/${id}/stats`, label: "الإحصائيات" },
    { href: `/dashboard/${id}/growth`, label: "🚀 أدوات النمو" },
    ...(showMembers ? [{ href: `/dashboard/${id}/members`, label: "الأعضاء والاشتراكات" }, { href: `/dashboard/${id}/attendance`, label: "سجل الحضور" }] : []),
    { href: `/dashboard/${id}/domain`, label: "الدومين" },
  ];

  return (
    <nav aria-label="أقسام إدارة النشاط" className="mx-auto flex max-w-3xl snap-x snap-mandatory gap-2 overflow-x-auto px-4 pt-6 text-sm [scrollbar-width:none] md:flex-wrap md:snap-none">
      {tabs.map((t) => {
        const active = path === t.href || (t.href.endsWith("/overview") && path === t.href.replace("/overview", ""));
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none ${active ? "bg-accent font-bold text-accent-foreground ring-accent" : "bg-surface ring-white/10 hover:ring-accent"}`}
          >
            <span>{t.label}</span>
            {"count" in t && (t.count ?? 0) > 0 && (
              <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-extrabold tabular-nums ${active ? "bg-black/15" : "bg-accent/15 text-accent"}`} aria-label={`${t.count} استفسارات جديدة`}>
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
