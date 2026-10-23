"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { InstallButton } from "@/components/InstallButton";

export type NavLink = { href: string; label: string; cls?: string };

/** Phone menu: a button that opens a panel of all links; closes itself when the page changes. */
export function MobileMenu({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  return (
    <div className="md:hidden">
      <button type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpenAt(open ? null : pathname)}
        className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold ring-1 ring-white/10 hover:bg-white/15">{open ? "✕ إغلاق" : "☰ القائمة"}</button>
      {open && (
        <nav id="mobile-nav" className="absolute inset-x-0 top-full z-40 border-b border-white/10 bg-background px-4 pb-5 pt-3 shadow-xl">
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {links.map((l) => (
              <li key={l.href}><Link href={l.href} className={`block rounded-xl bg-surface px-3 py-3 ring-1 ring-white/10 ${l.cls ?? "text-foreground"}`}>{l.label}</Link></li>))}
          </ul>
          <div className="mt-3"><InstallButton /></div>
        </nav>
      )}
    </div>
  );
}
