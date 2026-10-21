import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { EQUIP_COND, dateAr, jod } from "@/lib/format";
import { clearEquipmentReports, removeEquipment } from "../actions";

export const metadata: Metadata = { title: "سوق المعدات", robots: { index: false } };

export default async function MarketAdmin() {
  const { supabase } = await requireUser();
  const [{ data }, { data: reps }] = await Promise.all([
    supabase.from("equipment_listings").select("*,organizations(slug,name_ar)").neq("status", "removed").order("created_at", { ascending: false }).limit(200),
    supabase.from("equipment_reports").select("listing_id,reason,created_at").order("created_at", { ascending: false }).limit(500),
  ]);
  const byListing = new Map<string, string[]>();
  for (const r of reps ?? []) byListing.set(r.listing_id, [...(byListing.get(r.listing_id) ?? []), r.reason ?? "بدون سبب"]);
  const list = [...(data ?? [])].sort((a, b) => (byListing.get(b.id)?.length ?? 0) - (byListing.get(a.id)?.length ?? 0));
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-extrabold">سوق المعدات ({list.length})</h1>
      <ul className="space-y-3">
        {list.map((l) => {
          const r = byListing.get(l.id) ?? [];
          return (
            <li key={l.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-surface p-5 ring-1 ring-white/10">
              <div className="min-w-0 space-y-1">
                <p className="font-semibold">{l.title_ar} <span className="text-xs text-muted">· {EQUIP_COND[l.condition]} · {l.kind === "sale" ? jod(l.price_jod) : "تبديل"} · {l.status}</span></p>
                <p className="text-xs text-muted">{l.organizations?.name_ar} · ينتهي {dateAr(l.expires_at)}</p>
                {r.length > 0 && <p className="text-sm text-red-200">🚩 {r.length} بلاغ: {r.slice(0, 3).join(" / ")}</p>}
              </div>
              <div className="flex gap-2 text-xs">
                {l.organizations && <Link href={`/g/${l.organizations.slug}`} className="rounded-lg bg-white/10 px-3 py-1">الصفحة</Link>}
                {r.length > 0 && <form action={clearEquipmentReports.bind(null, l.id)}><button className="rounded-lg bg-white/10 px-3 py-1">مسح البلاغات</button></form>}
                <form action={removeEquipment.bind(null, l.id)}><button className="rounded-lg bg-red-500/30 px-3 py-1">إزالة</button></form>
              </div>
            </li>
          );
        })}
        {list.length === 0 && <li className="text-muted">لا توجد إعلانات.</li>}
      </ul>
    </div>
  );
}
