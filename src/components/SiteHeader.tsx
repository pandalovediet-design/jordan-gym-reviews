import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 print:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-extrabold">
          Jordan <span className="text-accent">Gym</span> Reviews
        </Link>
        <nav className="flex gap-4 text-sm text-muted">
          <Link href="/search" className="hover:text-foreground">البحث</Link>
          <Link href="/favorites" className="hover:text-foreground">❤️ المفضلة</Link>
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
      <p className="mt-2 flex justify-center gap-4"><Link href="/terms" className="hover:text-foreground">الشروط</Link><Link href="/privacy" className="hover:text-foreground">الخصوصية</Link></p>
    </footer>
  );
}
