import Link from "next/link";
import { HeaderAuth } from "@/components/HeaderAuth";
import { InstallButton } from "@/components/InstallButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteTabs, type NavLink } from "@/components/SiteTabs";
import { NAV_CATALOG } from "@/lib/site-settings";

export async function SiteHeader() {
  // The header carries the destinations people use most; «كل الأقسام» holds the rest.
  const MAIN = ["/search", "/pink", "/now", "/deals", "/exercises"];
  const tabs: NavLink[] = [{ href: "/directory", label: "الدليل" }, ...NAV_CATALOG.filter((n) => MAIN.includes(n.href)).map((n) => ({ href: n.href, label: n.label.replace(/^[^\p{L}]+/u, "").trim() })), { href: "/sections", label: "كل الأقسام" }];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/90 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
        <Link
          href="/"
          aria-label="GYMJO — الصفحة الرئيسية"
          className="group flex min-w-0 items-center gap-2.5 rounded-xl text-sm font-black tracking-tight transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:gap-3 sm:text-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark-96.png" alt="" width={44} height={44} className="size-10 shrink-0 rounded-2xl object-cover ring-1 ring-accent/40 shadow-lg shadow-black/40 transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none sm:size-11" />
          <span className="flex min-w-0 flex-col items-start gap-1">
            <span className="wordmark text-xl sm:text-2xl">GYM<b>JO</b></span>
          </span>
        </Link>
        <SiteTabs links={tabs} />
        <div className="flex shrink-0 items-center gap-1.5 text-sm sm:gap-2">
          <span className="hidden sm:inline-flex"><ThemeToggle /></span>
          <HeaderAuth />
          <InstallButton />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="print:hidden mt-16 border-t border-white/10 bg-black/[0.025]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col items-center gap-4 text-center sm:gap-5">
          <Link href="/" aria-label="GYMJO" className="flex items-center gap-3 rounded-xl transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/mark-96.png" alt="" width={48} height={48} loading="lazy" className="size-12 rounded-2xl object-cover ring-1 ring-accent/40" />
            <span className="wordmark text-2xl">GYM<b>JO</b></span>
          </Link>
          <div aria-hidden className="flag-rule w-24" />
          <p className="text-sm leading-6 text-muted">دليلك لاكتشاف الأندية والأنشطة الرياضية في الأردن</p>
          <nav aria-label="روابط تذييل الموقع" className="flex max-w-3xl flex-wrap justify-center gap-x-4 gap-y-3 text-sm">
            <Link href="/directory" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">الدليل</Link>
            <Link href="/guides" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">أدلة</Link>
            <Link href="/pink" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">Pink Zone</Link>
            <Link href="/join" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">أضف ناديك</Link>
            <Link href="/sponsors" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">للرعاة</Link>
            <Link href="/terms" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">الشروط</Link>
            <Link href="/privacy" className="rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">الخصوصية</Link>
          </nav>
          <div className="h-px w-full max-w-3xl bg-white/10" />
          <p className="text-xs text-muted">© {new Date().getFullYear()} GYMJO · جزء من منصة GYM. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
