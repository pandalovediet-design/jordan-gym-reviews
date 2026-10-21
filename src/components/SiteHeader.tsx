import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={44} height={44} className="size-11 rounded-full object-cover" />
          <span>Jordan <span className="text-accent">Gym</span> Reviews</span>
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <Link href="/search" className="hover:text-foreground">البحث</Link>
          <Link href="/pink" className="text-pink-300 hover:text-pink-200">💗 Pink Zone</Link>
          <Link href="/now" className="hover:text-foreground">⏱️ هسا</Link>
          <Link href="/awards" className="hover:text-foreground">🏆 نادي الشهر</Link>
          <Link href="/trails" className="hover:text-foreground">المسارات</Link>
          <Link href="/tools" className="hover:text-foreground">الحاسبة</Link>
          <Link href="/favorites" className="hover:text-foreground">❤️ المفضلة</Link>
          <Link href="/join" className="hover:text-foreground">سجّل نشاطك</Link>
          <Link href="/login" className="hover:text-foreground">دخول الأنشطة</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="print:hidden mt-16 border-t border-white/10 py-8 text-center text-sm text-muted">
      <p>Jordan Gym Reviews — دليل الرياضة في الأردن</p>
      <p className="mt-2 flex justify-center gap-4"><Link href="/directory" className="hover:text-foreground">الدليل</Link><Link href="/guides" className="hover:text-foreground">أدلة</Link><Link href="/pink" className="hover:text-foreground">Pink Zone</Link><Link href="/join" className="hover:text-foreground">سجّل نشاطك</Link><Link href="/terms" className="hover:text-foreground">الشروط</Link><Link href="/privacy" className="hover:text-foreground">الخصوصية</Link></p>
    </footer>
  );
}
