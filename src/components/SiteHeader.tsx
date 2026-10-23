import Link from "next/link";
import { InstallButton } from "@/components/InstallButton";
import { MobileMenu, type NavLink } from "@/components/MobileMenu";

const LINKS: NavLink[] = [
  { href: "/search", label: "البحث" },
  { href: "/pink", label: "💗 Pink Zone", cls: "text-pink-300" },
  { href: "/now", label: "⏱️ هسا" },
  { href: "/awards", label: "🏆 نادي الشهر" },
  { href: "/exercises", label: "🏋️ التمارين" },
  { href: "/no-gym", label: "🏠 من غير جيم" },
  { href: "/no-deprivation", label: "🥗 من غير حرمان" },
  { href: "/rooh-w-jasad", label: "🕌 روح وجسد" },
  { href: "/reels", label: "🎬 ريلز" },
  { href: "/deals", label: "🎟️ أكواد خصم" },
  { href: "/market", label: "🔄 سوق المعدات" },
  { href: "/trails", label: "المسارات" },
  { href: "/tools", label: "الحاسبة" },
  { href: "/log", label: "🔥 سجل تمريني" },
  { href: "/favorites", label: "❤️ المفضلة" },
  { href: "/join", label: "سجّل نشاطك" },
  { href: "/login", label: "دخول الأنشطة" },
];

export function SiteHeader() {
  return (
    <header className="relative border-b border-white/10 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3 md:py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={44} height={44} className="size-11 rounded-full object-cover" />
          <span>Jordan <span className="text-accent">Gym</span> Reviews</span>
        </Link>
        <MobileMenu links={LINKS} />
        <nav className="hidden flex-wrap gap-x-4 gap-y-1 text-sm text-muted md:flex">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className={l.cls ? `${l.cls} hover:text-pink-200` : "hover:text-foreground"}>{l.label}</Link>)}
          <InstallButton />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="print:hidden mt-16 border-t border-white/10 py-8 text-center text-sm text-muted">
      <p>Jordan Gym Reviews — دليل الرياضة في الأردن</p>
      <p className="mx-auto mt-2 flex max-w-sm flex-wrap justify-center gap-x-4 gap-y-2 px-4"><Link href="/directory" className="hover:text-foreground">الدليل</Link><Link href="/guides" className="hover:text-foreground">أدلة</Link><Link href="/pink" className="hover:text-foreground">Pink Zone</Link><Link href="/join" className="hover:text-foreground">سجّل نشاطك</Link><Link href="/sponsors" className="hover:text-foreground">للرعاة</Link><Link href="/terms" className="hover:text-foreground">الشروط</Link><Link href="/privacy" className="hover:text-foreground">الخصوصية</Link></p>
    </footer>
  );
}
