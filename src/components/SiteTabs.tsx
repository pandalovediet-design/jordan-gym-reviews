"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = { href: string; label: string; cls?: string };

/** Accessible, touch-friendly section navigation with a clear current-page state. */
export function SiteTabs({ links }: { links: NavLink[] }) {
  const path = usePathname();
  const on = (h: string) => path === h || (h !== "/" && path.startsWith(h + "/"));

  return (
    <nav
      aria-label="أقسام الموقع"
      className="mx-auto flex max-w-7xl snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-3 text-sm [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden sm:px-4 md:flex-wrap md:overflow-visible md:snap-none"
    >
      {links.map((l) => {
        const active = on(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={[
              "min-h-11 shrink-0 snap-start whitespace-nowrap rounded-full px-4 py-2.5 font-medium",
              "inline-flex items-center justify-center ring-1 transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "bg-accent font-bold text-accent-foreground ring-accent shadow-sm shadow-black/10"
                : "bg-surface text-muted ring-white/10 hover:text-foreground hover:ring-accent active:scale-[0.98]",
              l.cls ?? "",
            ].join(" ")}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
