"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = { href: string; label: string; cls?: string };

/** Site links as a pill bar: one row you swipe sideways on phones, wrapping on desktop; the current section is highlighted. */
export function SiteTabs({ links }: { links: NavLink[] }) {
  const path = usePathname();
  const on = (h: string) => path === h || (h !== "/" && path.startsWith(h + "/"));
  return (
    <nav aria-label="أقسام الموقع" className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={on(l.href) ? "page" : undefined}
          className={`whitespace-nowrap rounded-full px-4 py-2 ring-1 ring-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${on(l.href) ? "bg-accent font-bold text-accent-foreground" : `bg-surface hover:ring-accent ${l.cls ?? ""}`}`}>{l.label}</Link>
      ))}
    </nav>
  );
}
