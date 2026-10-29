"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type SectionLink = { href: string; icon: string; title: string; description: string };
type SectionGroup = { title: string; description: string; accent: string; links: SectionLink[] };

const FILTERS = [
  { id: "all", label: "كل الأقسام" },
  { id: "directory", label: "الدليل والاكتشاف" },
  { id: "lifestyle", label: "التمارين ونمط الحياة" },
  { id: "discover", label: "اكتشف أكثر" },
];

export function SectionExplorer({ groups, extras }: { groups: SectionGroup[]; extras: SectionLink[] }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const visibleGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ar");
    return groups
      .filter((group) => activeFilter === "all" || (activeFilter === "directory" && group.title === "الدليل والاكتشاف") || (activeFilter === "lifestyle" && group.title === "التمارين ونمط الحياة") || (activeFilter === "discover" && group.title === "اكتشف أكثر"))
      .map((group) => ({
        ...group,
        links: group.links.filter((item) => !normalized || `${item.title} ${item.description}`.toLocaleLowerCase("ar").includes(normalized)),
      }))
      .filter((group) => group.links.length > 0);
  }, [groups, query, activeFilter]);

  const visibleExtras = extras.filter((item) => !query.trim() || `${item.title} ${item.description}`.toLocaleLowerCase("ar").includes(query.trim().toLocaleLowerCase("ar")));
  const resultCount = visibleGroups.reduce((sum, group) => sum + group.links.length, 0) + (activeFilter === "all" || activeFilter === "discover" ? visibleExtras.length : 0);

  return (
    <>
      <section aria-label="البحث والتصفية في الأقسام" className="mb-8 rounded-3xl border border-[#e1ebe0] bg-surface p-4 shadow-sm sm:p-5">
        <label htmlFor="section-search" className="mb-2 block text-sm font-extrabold text-foreground">شو حابب تكتشف؟</label>
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg">🔎</span>
          <input id="section-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن ميزة، تمرين، عروض..." className="min-h-12 w-full rounded-2xl border border-border bg-background py-3 pr-12 pl-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-[#21834f] focus:ring-2 focus:ring-[#21834f]/15" />
          {query && <button type="button" onClick={() => setQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-muted hover:bg-background">مسح</button>}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="تصفية حسب نوع القسم">
          {FILTERS.map((filter) => (
            <button key={filter.id} type="button" aria-pressed={activeFilter === filter.id} onClick={() => setActiveFilter(filter.id)} className={`min-h-10 shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21834f] ${activeFilter === filter.id ? "border-[#21834f] bg-[#21834f] text-white" : "border-border bg-background text-muted hover:border-[#9acda4] hover:text-foreground"}`}>
              {filter.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted" aria-live="polite">عرض {resultCount} {resultCount === 1 ? "نتيجة" : "نتائج"}</p>
      </section>

      {resultCount > 0 ? (
        <div className="space-y-10">
          {visibleGroups.map((group, index) => (
            <section key={group.title} aria-labelledby={`section-group-${index}`}>
              <div className="mb-4">
                <h2 id={`section-group-${index}`} className="text-lg font-black text-foreground sm:text-xl">{group.title}</h2>
                <p className="mt-1 text-sm text-muted">{group.description}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.links.map((item) => (
                  <Link key={item.href} href={item.href} className="group flex min-h-[112px] items-start gap-3 rounded-2xl border border-[#e1ebe0] bg-surface p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#9acda4] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21834f] dark:border-[#344454] dark:hover:border-[#4fbd78]">
                    <span aria-hidden className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl ${group.accent}`}>{item.icon}</span>
                    <span className="min-w-0 flex-1 pt-0.5">
                      <span className="block font-extrabold text-foreground">{item.title}</span>
                      <span className="mt-1 block text-sm leading-5 text-muted">{item.description}</span>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-[#21834f]">استكشف <span aria-hidden className="transition-transform group-hover:-translate-x-1">←</span></span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
          {(activeFilter === "all" || activeFilter === "discover") && visibleExtras.length > 0 && (
            <section className="border-t border-border pt-8">
              <h2 className="mb-4 text-lg font-black text-foreground">للمهتمين بالتعاون</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleExtras.map((item) => (
                  <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-[#9acda4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21834f]">
                    <span aria-hidden className="flex size-11 items-center justify-center rounded-xl bg-[#e8f4e8] text-xl">{item.icon}</span>
                    <span><span className="block font-extrabold text-foreground">{item.title}</span><span className="mt-1 block text-sm text-muted">{item.description}</span></span>
                    <span aria-hidden className="mr-auto text-[#21834f]">←</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-surface px-5 py-12 text-center">
          <span aria-hidden className="text-4xl">🐼</span>
          <h2 className="mt-3 text-lg font-black text-foreground">ما لقينا قسم بهالاسم</h2>
          <p className="mt-2 text-sm text-muted">جرّب كلمة ثانية أو ارجع لكل الأقسام.</p>
          <button type="button" onClick={() => { setQuery(""); setActiveFilter("all"); }} className="mt-4 min-h-11 rounded-xl bg-[#21834f] px-5 py-2.5 text-sm font-extrabold text-white hover:bg-[#17683d]">عرض كل الأقسام</button>
        </div>
      )}
    </>
  );
}
