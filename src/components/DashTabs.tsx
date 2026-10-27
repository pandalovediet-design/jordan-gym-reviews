"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type OrgType = "gym" | "independent_coach" | "sports_facility" | "store" | "nutritionist";

const MEMBER_LABEL: Record<OrgType, string> = {
  gym: "الأعضاء والاشتراكات",
  independent_coach: "العملاء والباقات",
  sports_facility: "المشتركون",
  store: "العملاء",
  nutritionist: "العملاء والمتابعات",
};

const ATTENDANCE_LABEL: Record<OrgType, string> = {
  gym: "سجل الحضور",
  independent_coach: "سجل الجلسات",
  sports_facility: "سجل الدخول",
  store: "سجل الزيارات",
  nutritionist: "سجل الزيارات",
};

export function DashTabs({ id, showMembers, orgType, newInquiries = 0 }: { id: string; showMembers: boolean; orgType: OrgType; newInquiries?: number }) {
  const path = usePathname();
  const tabs = [
    { href: `/dashboard/${id}/overview`, label: "نظرة عامة" },
    { href: `/dashboard/${id}`, label: "✏️ تعديل صفحتي" },
    { href: `/dashboard/${id}/inquiries`, label: newInquiries > 0 ? `الاستفسارات (${newInquiries} جديد)` : "الاستفسارات" },
    { href: `/dashboard/${id}/stats`, label: "الإحصائيات" },
    ...(showMembers ? [
      { href: `/dashboard/${id}/members`, label: MEMBER_LABEL[orgType] },
      { href: `/dashboard/${id}/attendance`, label: ATTENDANCE_LABEL[orgType] },
    ] : []),
    { href: `/dashboard/${id}/domain`, label: "الدومين" },
  ];
  return (
    <nav aria-label="أقسام لوحة النشاط" className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 pt-6 text-sm [scrollbar-width:none] md:flex-wrap">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}
          className={`whitespace-nowrap rounded-full px-4 py-2 ring-1 ring-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${path === t.href ? "bg-accent font-bold text-accent-foreground" : "bg-surface hover:ring-accent"}`}>{t.label}</Link>
      ))}
    </nav>
  );
}
