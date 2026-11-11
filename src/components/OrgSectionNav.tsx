"use client";

import { useEffect, useState } from "react";

type Item = { href: string; label: string };

export function OrgSectionNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.href ?? "");

  useEffect(() => {
    const nodes = items
      .map((item) => document.querySelector<HTMLElement>(item.href))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-24% 0px -62% 0px", threshold: [0, 0.15, 0.35, 0.6] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav aria-label="أقسام النشاط" className="sticky top-14 z-30 md:top-[3.75rem] -mx-4 mt-5 flex gap-2 overflow-x-auto border-b border-white/10 bg-background/95 px-4 py-2.5 text-sm backdrop-blur [scrollbar-width:none] sm:-mx-6 sm:px-6">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          aria-current={active === item.href ? "location" : undefined}
          onClick={() => setActive(item.href)}
          className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 font-semibold transition-colors ${active === item.href ? "bg-accent text-accent-foreground" : "bg-surface text-muted ring-1 ring-white/10 hover:text-foreground hover:ring-accent"}`}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
