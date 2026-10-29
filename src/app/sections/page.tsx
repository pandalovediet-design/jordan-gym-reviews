import type { Metadata } from "next";
import Link from "next/link";
import { NAV_CATALOG } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "كل الأقسام",
  description: "استكشف أقسام GymJo واكتشف النوادي والمراكز والأنشطة الرياضية في الأردن.",
};

const MORE = [
  { href: "/directory", label: "📍 دليل النوادي حسب المدينة" },
  { href: "/guides", label: "📚 أدلة" },
  { href: "/join", label: "➕ سجّل نشاطك" },
  { href: "/sponsors", label: "🤝 للرعاة" },
];

export default function Sections() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 rounded-3xl border border-white/10 bg-surface p-6 sm:p-9"><p className="mb-2 text-xs font-extrabold tracking-widest text-accent">GYMJO · دليل الرياضة في الأردن</p><h1 className="text-3xl font-black sm:text-4xl">اكتشف عالم الرياضة حولك</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">تصفّح النوادي والمراكز الرياضية والخدمات حسب النوع والمدينة، ووصل للمكان المناسب إلك بسهولة.</p><div className="mt-5"><Link href="/search" className="rounded-xl bg-accent px-5 py-3 text-sm font-extrabold text-accent-foreground">اكتشف الأنشطة ←</Link></div></div><h2 className="mb-4 text-xl font-extrabold">استكشف المنصة</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[...NAV_CATALOG, ...MORE].map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex min-h-24 h-full items-center rounded-2xl border border-white/10 bg-surface px-4 py-5 font-bold shadow-lg transition hover:-translate-y-1 hover:border-accent/40">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
