import Link from "next/link";
import { HeaderAuth } from "@/components/HeaderAuth";
import { InstallButton } from "@/components/InstallButton";
import { SiteTabs, type NavLink } from "@/components/SiteTabs";
import { NAV_CATALOG, getSiteSettings } from "@/lib/site-settings";

export async function SiteHeader() {
  // The platform owner picks the tabs and their order in /admin/settings; everything else is on /sections.
  const { nav } = await getSiteSettings();
  const byHref = new Map<string, NavLink>(NAV_CATALOG.map((n) => [n.href, { ...n }]));
  const tabs: NavLink[] = [...nav.flatMap((h) => byHref.get(h) ?? []), { href: "/sections", label: "☰ كل الأقسام" }];
  return (
    <header className="border-b border-white/10 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={44} height={44} className="size-11 rounded-full object-cover" />
          <span>Jordan <span className="text-accent">Gym</span> Reviews</span>
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <HeaderAuth />
          <InstallButton />
        </div>
      </div>
      <SiteTabs links={tabs} />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="print:hidden mt-16 border-t border-white/10 py-8 text-center text-sm text-muted">
      <p>Jordan Gym Reviews — دليل الرياضة في الأردن</p>
      <p className="mx-auto mt-2 flex max-w-xs flex-wrap justify-center gap-x-3 gap-y-2 px-4"><Link href="/directory" className="hover:text-foreground">الدليل</Link><Link href="/guides" className="hover:text-foreground">أدلة</Link><Link href="/pink" className="hover:text-foreground">Pink Zone</Link><Link href="/join" className="hover:text-foreground">سجّل نشاطك</Link><Link href="/sponsors" className="hover:text-foreground">للرعاة</Link><Link href="/terms" className="hover:text-foreground">الشروط</Link><Link href="/privacy" className="hover:text-foreground">الخصوصية</Link></p>
    </footer>
  );
}
