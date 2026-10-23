import Link from "next/link";
import { InstallButton } from "@/components/InstallButton";
import { SiteTabs, type NavLink } from "@/components/SiteTabs";

const LINKS: NavLink[] = [
  { href: "/search", label: "البحث" },
  { href: "/pink", label: "💗 Pink Zone", cls: "text-pink-300" },
  { href: "/now", label: "⏱️ هسا" },
  { href: "/awards", label: "🏆 نادي الشهر" },
  { href: "/exercises", label: "🏋️ التمارين" },
  { href: "/log", label: "🔥 سجل تمريني" },
  { href: "/deals", label: "🎟️ أكواد خصم" },
  { href: "/no-gym", label: "🏠 من غير جيم" },
  { href: "/no-deprivation", label: "🥗 من غير حرمان" },
  { href: "/rooh-w-jasad", label: "🕌 روح وجسد" },
  { href: "/reels", label: "🎬 ريلز" },
  { href: "/market", label: "🔄 سوق المعدات" },
  { href: "/trails", label: "المسارات" },
  { href: "/tools", label: "الحاسبة" },
  { href: "/favorites", label: "❤️ المفضلة" },
  { href: "/join", label: "سجّل نشاطك" },
  { href: "/login", label: "دخول الأنشطة" },
];

const REGISTER = "/join";
const LOGIN = "/login";

export function SiteHeader() {
  const tabs = LINKS.filter((l) => l.href !== REGISTER && l.href !== LOGIN);
  return (
    <header className="border-b border-white/10 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={44} height={44} className="size-11 rounded-full object-cover" />
          <span>Jordan <span className="text-accent">Gym</span> Reviews</span>
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Link href={LOGIN} className="rounded-xl px-3 py-2 ring-1 ring-white/20 hover:text-accent">دخول</Link>
          <Link href={REGISTER} className="rounded-xl bg-accent px-3 py-2 font-bold text-accent-foreground">سجّل نشاطك</Link>
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
