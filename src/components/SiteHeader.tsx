import Link from "next/link";
import { HeaderAuth } from "@/components/HeaderAuth";
import { InstallButton } from "@/components/InstallButton";
import { SiteTabs, type NavLink } from "@/components/SiteTabs";
import { NAV_CATALOG } from "@/lib/site-settings";

export async function SiteHeader() {
  // Keep every main service directly visible in the navigation; /sections remains the full directory.
  const tabs: NavLink[] = [...NAV_CATALOG.map((n) => ({ ...n })), { href: "/sections", label: "☰ كل الأقسام" }];

  return (
    <header className="sticky top-0 z-40 border-b border-[#e2ebe2] bg-white/95 shadow-lg shadow-black/5 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-5 sm:py-3.5">
        <Link
          href="/"
          aria-label="GymJo — الصفحة الرئيسية"
          className="group flex min-w-0 items-center gap-2.5 rounded-xl text-sm font-black tracking-tight transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:gap-3 sm:text-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand-mark.svg" alt="" width={44} height={44} className="size-10 shrink-0 rounded-2xl object-cover shadow-lg shadow-black/30 transition-transform duration-300 group-hover:-rotate-3 motion-reduce:transition-none motion-reduce:transform-none sm:size-11" />
          <span className="truncate"><span className="text-[#21834f]">GymJo</span></span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 text-sm sm:gap-2">
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
    <footer className="print:hidden mt-16 border-t border-[#e0e9df] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col items-center gap-4 text-center sm:gap-5">
          <Link href="/" className="rounded-lg text-sm font-extrabold tracking-tight text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <span className="text-[#21834f]">GymJo</span>
          </Link>
          <p className="text-sm leading-6 text-muted">اكتشف ناديك. دليلك للرياضة في الأردن</p>
          <nav aria-label="روابط تذييل الموقع" className="flex max-w-3xl flex-wrap justify-center gap-x-4 gap-y-3 text-sm">
            <Link href="/directory" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">الدليل</Link>
            <Link href="/guides" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">أدلة</Link>
            <Link href="/pink" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">Pink Zone</Link>
            <Link href="/join" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">سجّل نشاطك</Link>
            <Link href="/sponsors" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">للرعاة</Link>
            <Link href="/terms" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">الشروط</Link>
            <Link href="/privacy" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">الخصوصية</Link>
          </nav>
          <div className="h-px w-full max-w-3xl bg-[#e0e9df]" />
          <p className="text-xs text-muted">© {new Date().getFullYear()} GymJo. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
