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
      aria-label="أقسام الموقع، اسحب أفقيًا على الهاتف لاستعراض المزيد"
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
              "inline-flex items-center justify-center border transition-colors duration-200 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21834f] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-[#83d6a0] dark:focus-visible:ring-offset-[#17212b]",
              active
                ? "border-[#21834f] bg-[#21834f] font-bold text-white shadow-sm shadow-[#1c5737]/15"
                : "border-[#e1eae0] bg-[#f6f9f4] text-[#52675a] hover:border-[#a9d0ad] hover:bg-[#edf6eb] hover:text-[#17683d] active:scale-[0.98] motion-reduce:active:scale-100 dark:border-[#344454] dark:bg-[#212d3b] dark:text-[#d0dbe6] dark:hover:border-[#4fbd78] dark:hover:bg-[#294638] dark:hover:text-[#b8f0c9]",
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
