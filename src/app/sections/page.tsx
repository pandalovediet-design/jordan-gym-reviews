import type { Metadata } from "next";
import Link from "next/link";
import { NAV_CATALOG } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "كل الأقسام",
  description: "كل أقسام Jordan Gym Reviews بمكان واحد: البحث، Pink Zone، التمارين، المسارات، أكواد الخصم وغيرها.",
};

const MORE = [
  { href: "/directory", label: "📍 دليل النوادي حسب المدينة" },
  { href: "/guides", label: "📚 أدلة" },
  { href: "/join", label: "➕ سجّل نشاطك" },
  { href: "/sponsors", label: "🤝 للرعاة" },
];

export default function Sections() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold">كل الأقسام</h1>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[...NAV_CATALOG, ...MORE].map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex h-full items-center rounded-2xl bg-surface px-4 py-4 font-semibold ring-1 ring-white/10 hover:ring-accent">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
