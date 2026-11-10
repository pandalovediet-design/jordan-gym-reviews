import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ORG_TYPE_LABEL } from "@/lib/format";

export const metadata: Metadata = { title: "الناقص", robots: { index: false } };

const CHECKS = [
  ["photos", "صور"], ["prices", "أسعار"], ["hours", "دوام"], ["whatsapp", "واتساب"], ["phone", "هاتف"], ["map", "موقع"], ["about", "نبذة"],
] as const;
type Key = (typeof CHECKS)[number][0];

async function idSet(q: PromiseLike<{ data: { organization_id: string }[] | null }>) {
  const { data } = await q;
  return new Set((data ?? []).map((r) => r.organization_id));
}

export default async function Missing({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const [{ data: orgs }, media, plans, hours] = await Promise.all([
    supabase.from("organizations").select("id,name_ar,slug,type,city,area,phone,whatsapp,maps_url,description_ar,is_claimed").eq("status", "published").order("name_ar").limit(5000),
    idSet(supabase.from("organization_media").select("organization_id").limit(20000)),
    idSet(supabase.from("membership_plans").select("organization_id").eq("is_active", true).limit(20000)),
    idSet(supabase.from("organization_hours").select("organization_id").limit(50000)),
  ]);
  const rows = (orgs ?? []).map((o) => {
    const miss: Key[] = [];
    if (!media.has(o.id)) miss.push("photos");
    if (o.type === "gym" && !plans.has(o.id)) miss.push("prices");
    if (!hours.has(o.id)) miss.push("hours");
    if (!o.whatsapp) miss.push("whatsapp");
    if (!o.phone) miss.push("phone");
    if (!o.maps_url) miss.push("map");
    if (!o.description_ar || o.description_ar.length < 30) miss.push("about");
    return { ...o, miss };
  });
  const total = rows.length;
  const complete = rows.filter((r) => r.miss.length === 0).length;
  const count = (k: Key) => rows.filter((r) => r.miss.includes(k)).length;
  const f = CHECKS.some(([k]) => k === sp.f) ? (sp.f as Key) : null;
  const list = rows.filter((r) => (f ? r.miss.includes(f) : r.miss.length > 0)).sort((a, b) => b.miss.length - a.miss.length || a.name_ar.localeCompare(b.name_ar, "ar")).slice(0, 150);
  const label = Object.fromEntries(CHECKS) as Record<Key, string>;
  const pct = total ? Math.round((complete / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-extrabold">الناقص بصفحات الأماكن</h1>
        <p className="mt-1 text-sm leading-6 text-muted">الأماكن المنشورة مرتّبة من الأكثر نقصاً. اضغط على مكان لتكمّل بياناته.</p>
      </div>

      <section className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p><span className="font-display text-4xl font-black tabular-nums text-accent">{complete}</span> <span className="text-muted">من {total} مكان صفحته كاملة</span></p>
          <p className="font-display text-xl font-extrabold tabular-nums">{pct}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="نسبة الصفحات الكاملة"><div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></div>
      </section>

      <nav aria-label="نوع النقص" className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/missing" aria-current={!f ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-full px-4 font-bold ring-1 ${!f ? "bg-accent text-accent-foreground ring-accent" : "ring-white/10 hover:ring-accent"}`}>الكل</Link>
        {CHECKS.map(([k, l]) => (
          <Link key={k} href={`/admin/missing?f=${k}`} aria-current={f === k ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 font-bold ring-1 ${f === k ? "bg-accent text-accent-foreground ring-accent" : "ring-white/10 hover:ring-accent"}`}>
            بدون {l} <span className="tabular-nums opacity-80">{count(k)}</span>
          </Link>
        ))}
      </nav>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/20 px-6 py-10 text-center text-muted">ما في نقص بهالفلتر. 👌</p>
      ) : (
        <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl bg-surface ring-1 ring-white/10">
          {list.map((o) => (
            <li key={o.id}>
              <Link href={`/dashboard/${o.id}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4 transition-colors hover:bg-white/5">
                <div className="min-w-0">
                  <p className="font-bold">{o.name_ar}{!o.is_claimed && <span className="ms-2 text-xs font-normal text-muted">بدون صاحب</span>}</p>
                  <p className="text-xs text-muted">{ORG_TYPE_LABEL[o.type]} · {[o.city, o.area].filter(Boolean).join("، ")}</p>
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {o.miss.map((m) => <li key={m} className="rounded-full bg-red-400/10 px-2.5 py-1 text-xs font-bold text-red-200">{label[m]}</li>)}
                </ul>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {list.length === 150 && <p className="text-center text-xs text-muted">معروض أول 150 مكان. كمّلهم وبيطلع الباقي.</p>}
    </div>
  );
}
