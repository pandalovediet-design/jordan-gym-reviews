"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashTabs({ id, showMembers, newInquiries = 0 }: { id: string; showMembers: boolean; newInquiries?: number }) {
  const path = usePathname();
  const tabs = [
    { href: `/dashboard/${id}/overview`, label: "نظرة عامة" },
    { href: `/dashboard/${id}`, label: "الصفحة والخدمات" },
    { href: `/dashboard/${id}/stats`, label: "الإحصائيات" },
    ...(showMembers ? [{ href: `/dashboard/${id}/members`, label: "الأعضاء والاشتراكات" }, { href: `/dashboard/${id}/attendance`, label: "سجل الحضور" }] : []),
    { href: `/dashboard/${id}/domain`, label: "الدومين" },
    { href: `/dashboard/${id}/inquiries`, label: newInquiries > 0 ? `الاستفسارات (${newInquiries} جديد)` : "الاستفسارات" },
  ];
  return (
    <nav className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 pt-6 text-sm">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 ring-1 ring-white/10 ${path === t.href ? "bg-accent font-bold text-accent-foreground" : "bg-surface hover:ring-accent"}`}>{t.label}</Link>
      ))}
    </nav>
  );
}
