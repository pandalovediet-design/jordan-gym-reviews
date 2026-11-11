import Link from "next/link";
import { HeaderAuth } from "@/components/HeaderAuth";
import { InstallButton } from "@/components/InstallButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteTabs, type NavLink } from "@/components/SiteTabs";
import { NAV_CATALOG } from "@/lib/site-settings";

/** The lockup: panda head + GYM[JO]. Used in the header and the footer. */
function Brand({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mark-96.png" alt="" width={48} height={48} className={`${size === "lg" ? "size-12" : "size-10"} shrink-0 rounded-xl object-cover`} />
      <span className={`wordmark ${size === "lg" ? "text-3xl" : "text-2xl"}`}>GYM<b>JO</b></span>
    </>
  );
}

export async function SiteHeader() {
  // The header carries the destinations people use most; «كل الأقسام» holds the rest.
  const MAIN = ["/search", "/pink", "/now", "/deals", "/exercises"];
  const tabs: NavLink[] = [{ href: "/directory", label: "الدليل" }, ...NAV_CATALOG.filter((n) => MAIN.includes(n.href)).map((n) => ({ href: n.href, label: n.label.replace(/^[^\p{L}]+/u, "").trim() })), { href: "/sections", label: "كل الأقسام" }];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-5">
        <Link href="/" aria-label="GYMJO — الصفحة الرئيسية" className="flex min-w-0 items-center gap-2.5 rounded-xl">
          <Brand />
        </Link>
        <SiteTabs links={tabs} />
        <div className="flex shrink-0 items-center gap-1.5 text-sm sm:gap-2">
          <ThemeToggle />
          <HeaderAuth />
          <span className="hidden lg:inline-flex"><InstallButton /></span>
        </div>
      </div>
    </header>
  );
}

const FOOT = [
  { title: "الدليل", links: [["/directory", "كل الأماكن"], ["/directory/gym", "نوادي"], ["/directory/sports_facility", "ملاعب ومسابح"], ["/pink", "Pink Zone للنساء"], ["/now", "فاتح هسا"]] },
  { title: "إلك", links: [["/exercises", "مكتبة التمارين"], ["/log", "سجل تمريني"], ["/tools", "الحاسبات"], ["/deals", "أكواد الخصم"], ["/guides", "أدلة ونصائح"]] },
  { title: "لأصحاب الأماكن", links: [["/join", "أضف ناديك مجاناً"], ["/sponsors", "للرعاة والإعلان"], ["/terms", "الشروط"], ["/privacy", "الخصوصية"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="ink mt-16 print:hidden">
      <div aria-hidden className="flag-rule rounded-none" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_2fr] md:py-14">
        <div>
          <Link href="/" aria-label="GYMJO" className="inline-flex items-center gap-3 rounded-xl"><Brand size="lg" /></Link>
          <p className="mt-4 max-w-xs text-sm leading-7 text-muted">دليل النوادي والملاعب والمدربين في الأردن: الأسعار والدوام والموقع، وتواصل مباشر مع صاحب المكان.</p>
          <div className="mt-5"><InstallButton /></div>
        </div>
        <nav aria-label="روابط تذييل الموقع" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {FOOT.map((col) => (
            <div key={col.title}>
              <h2 className="text-base font-bold">{col.title}</h2>
              <ul className="mt-3 space-y-1 text-sm">
                {col.links.map(([href, label]) => (
                  <li key={href}><Link href={href} className="inline-flex min-h-9 items-center text-muted transition-colors hover:text-accent">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <p className="border-t border-line px-4 py-5 text-center text-xs text-muted">© {new Date().getFullYear()} GYMJO، جزء من منصة GYM. جميع الحقوق محفوظة.</p>
    </footer>
  );
}
