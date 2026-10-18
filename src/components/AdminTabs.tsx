"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/orgs", label: "الأنشطة" },
  { href: "/admin/users", label: "المستخدمون" },
  { href: "/admin/products", label: "المنتجات" },
];

export function AdminTabs() {
  const path = usePathname();
  return (
    <nav className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pt-6 text-sm">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 ring-1 ring-white/10 ${path === t.href ? "bg-accent font-bold text-accent-foreground" : "bg-surface hover:ring-accent"}`}>{t.label}</Link>
      ))}
    </nav>
  );
}
