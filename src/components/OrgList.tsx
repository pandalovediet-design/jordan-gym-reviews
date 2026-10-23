"use client";

import Link from "next/link";
import { useState } from "react";

export type OrgRow = { id: string; name: string; meta: string; status: string; newCount: number };

/** The owner's activities with a quick filter by name, city or type. */
export function OrgList({ rows }: { rows: OrgRow[] }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle ? rows.filter((r) => `${r.name} ${r.meta}`.toLowerCase().includes(needle)) : rows;
  return (
    <>
      {rows.length > 5 && (
        <input
          id="org-search" type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={`دوّر بين أنشطتك (${rows.length})`} aria-label="بحث في أنشطتي"
          className="mb-4 w-full rounded-xl bg-surface px-4 py-3 ring-1 ring-white/10 outline-none focus:ring-accent"
        />
      )}
      {shown.length === 0 ? (
        <p className="rounded-2xl bg-surface p-8 text-center text-muted">ما في نتائج.</p>
      ) : (
        <ul className="space-y-3">{shown.map((o) => (
          <li key={o.id}><Link href={`/dashboard/${o.id}/overview`} className="flex items-center justify-between rounded-2xl bg-surface p-5 ring-1 ring-white/10 hover:ring-accent/60">
            <div><p className="font-bold">{o.name}</p><p className="text-sm text-muted">{o.meta}</p></div>
            <span className="flex items-center gap-2">{o.newCount > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">{o.newCount} استفسار جديد</span>}<span className="rounded-full bg-white/10 px-3 py-1 text-xs">{o.status}</span></span></Link></li>))}</ul>
      )}
    </>
  );
}
