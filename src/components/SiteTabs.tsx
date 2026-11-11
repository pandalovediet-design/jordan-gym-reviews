"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = { href: string; label: string; cls?: string };

function useIsOn() {
  const path = usePathname();
  return (h: string) => (h === "/" ? path === "/" : path === h || path.startsWith(h + "/"));
}

/** Desktop: one quiet row of the main destinations. Everything else lives in «كل الأقسام». */
export function SiteTabs({ links }: { links: NavLink[] }) {
  const on = useIsOn();
  return (
    <nav aria-label="أقسام الموقع" className="hidden items-center gap-1 text-sm md:flex">
      {links.map((l) => {
        const active = on(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={[
              // Active tab: ink text with a lime bar under it (the rim light), not a filled pill.
              "relative inline-flex min-h-11 items-center whitespace-nowrap px-3 font-semibold transition-colors motion-reduce:transition-none",
              active ? "text-foreground after:absolute after:inset-x-3 after:bottom-1 after:h-[3px] after:rounded-full after:bg-lime" : "text-muted hover:text-foreground",
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

const ICONS: Record<string, React.ReactNode> = {
  home: <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" />,
  list: <path d="M4 6h16M4 12h16M4 18h10" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.500 15.4 12 20 12 20Z" />,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>,
};
const BAR = [
  { href: "/", label: "الرئيسية", icon: "home" },
  { href: "/directory", label: "الدليل", icon: "list" },
  { href: "/search", label: "بحث", icon: "search" },
  { href: "/favorites", label: "المفضلة", icon: "heart" },
  { href: "/sections", label: "الأقسام", icon: "grid" },
];

/** Phones: a thumb-reach tab bar with the five places people go most. */
export function BottomBar() {
  const on = useIsOn();
  const path = usePathname();
  // A place's page has its own contact bar at the bottom (WhatsApp, call), which matters more there.
  if (path.startsWith("/g/")) return null;
  return (
    <nav aria-label="التنقل السريع" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl print:hidden md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {BAR.map((b) => {
          const active = on(b.href);
          const main = b.icon === "search";
          return (
            <li key={b.href}>
              <Link href={b.href} aria-current={active ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${active ? "text-foreground" : "text-muted"}`}>
                <span className={main ? "flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground" : active ? "rounded-full bg-lime px-3 py-0.5 text-ink" : "px-3 py-0.5"}>
                  <svg aria-hidden viewBox="0 0 24 24" className={main ? "size-5" : "size-[22px]"} fill="none" stroke="currentColor" strokeWidth={active || main ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">{ICONS[b.icon]}</svg>
                </span>
                {!main && b.label}
                {main && <span className="sr-only">{b.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
