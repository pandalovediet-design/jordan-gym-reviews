"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ActivityType =
  | "gym"
  | "sports_facility"
  | "store"
  | "nutritionist"
  | "independent_coach"
  | "healthy_food"
  | "sports_health";

type Tab = { href: string; label: string; count?: number };

const MANAGE_LABEL: Record<ActivityType, string> = {
  gym: "إدارة النادي",
  sports_facility: "إدارة الملاعب والحجوزات",
  store: "إدارة المتجر والمنتجات",
  nutritionist: "إدارة خدمات التغذية",
  independent_coach: "إدارة التدريب والباقات",
  healthy_food: "إدارة الوجبات",
  sports_health: "إدارة العلاجات",
};

const MEMBER_TYPES: ActivityType[] = [
  "gym",
  "sports_facility",
  "nutritionist",
  "independent_coach",
];

export function DashTabs({
  id,
  activityType,
  newInquiries = 0,
}: {
  id: string;
  activityType: ActivityType | null;
  newInquiries?: number;
}) {
  const path = usePathname();
  const tabs: Tab[] = [
    { href: `/dashboard/${id}/overview`, label: "نظرة عامة" },
    {
      href: `/dashboard/${id}`,
      label: activityType ? MANAGE_LABEL[activityType] : "إدارة النشاط",
    },
    { href: `/dashboard/${id}/posts`, label: "التحديثات" },
    { href: `/dashboard/${id}/inquiries`, label: "الاستفسارات", count: newInquiries },
    { href: `/dashboard/${id}/stats`, label: "الأداء والإحصائيات" },
    ...(activityType && MEMBER_TYPES.includes(activityType)
      ? [
          { href: `/dashboard/${id}/members`, label: activityType === "independent_coach" ? "العملاء والبرامج" : activityType === "nutritionist" ? "العملاء والخطط" : activityType === "sports_facility" ? "العملاء والاشتراكات" : "الأعضاء والاشتراكات" },
          { href: `/dashboard/${id}/attendance`, label: "سجل الحضور" },
        ]
      : []),
    ...(activityType === "independent_coach"
      ? [{ href: `/dashboard/${id}/exercises`, label: "شروحات التمارين" }]
      : []),
    { href: `/dashboard/${id}/growth`, label: "التسويق والنمو" },
    { href: `/dashboard/${id}/domain`, label: "الدومين" },
  ];

  return (
    <nav aria-label="أقسام إدارة النشاط" className="mx-auto flex max-w-5xl snap-x snap-mandatory gap-2 overflow-x-auto px-4 pt-6 text-sm [scrollbar-width:none] md:flex-wrap md:snap-none">
      {tabs.map((tab) => {
        const active = path === tab.href || (tab.href.endsWith("/overview") && path === tab.href.replace("/overview", ""));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none ${active ? "bg-accent font-bold text-accent-foreground ring-accent" : "bg-surface ring-line hover:ring-foreground"}`}
          >
            <span>{tab.label}</span>
            {(tab.count ?? 0) > 0 && (
              <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-extrabold tabular-nums ${active ? "bg-black/15" : "bg-accent/15 text-accent"}`} aria-label={`${tab.count} استفسارات جديدة`}>
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
