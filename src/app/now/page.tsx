import type { Metadata } from "next";
import Link from "next/link";
import { NowLocate } from "@/components/NowLocate";
import { OrgCard } from "@/components/OrgCard";
import { listOpenNow } from "@/lib/open-now";
import { hhmm, ORG_TYPE_PLURAL } from "@/lib/format";
import { isOrgType } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "وين أتمرن هسا؟ مفتوح قريب منك",
  description: "الأماكن الرياضية المفتوحة هسا الأقرب إلك، والملاعب اللي فيها مواعيد متاحة اليوم.",
  alternates: { canonical: "/now" },
};

export default async function Now({ searchParams }: PageProps<"/now">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const lat = Number.parseFloat(one(sp.lat) ?? ""), lng = Number.parseFloat(one(sp.lng) ?? "");
  const hasPos = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const t = one(sp.type);
  const type = t && isOrgType(t) ? t : undefined;
  const res = hasPos ? await listOpenNow({ lat, lng }, type).catch(() => null) : null;
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">⏱️ وين أتمرن هسا؟</h1>
      <p className="mt-2 text-muted">الأماكن المفتوحة الآن الأقرب إلك. موقعك ما بنخزّنه، بنستخدمه للحساب بس.</p>
      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        {([undefined, "gym", "sports_facility", "sports_health"] as const).map((x) => {
          const u = new URLSearchParams(); if (hasPos) { u.set("lat", String(lat)); u.set("lng", String(lng)); } if (x) u.set("type", x);
          return <Link key={x ?? "all"} href={`/now?${u}`} className={`rounded-full px-4 py-1.5 ring-1 ring-white/10 ${x === type ? "bg-accent text-accent-foreground" : "bg-surface"}`}>{x ? ORG_TYPE_PLURAL[x] : "الكل"}</Link>;
        })}
      </div>
      {!hasPos && <div className="mt-8"><NowLocate type={type} /></div>}
      {hasPos && !res && <p className="mt-8 text-red-300">تعذّر جلب النتائج، جرّب مرة ثانية.</p>}
      {res && (
        <>
          <div className="mt-4"><NowLocate type={type} label="🔄 حدّث موقعي" /></div>
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-bold">مفتوح هسا ({res.open.length})</h2>
            {res.open.length === 0 ? <p className="text-muted">ما في أماكن مفتوحة قريبة من موقعك هسا. جرّب <Link href="/guides/late" className="text-accent underline">أماكن بتسهر</Link>.</p> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{res.open.slice(0, 12).map((o) => <OrgCard key={o.id} org={o} />)}</div>)}
          </section>
          {res.slots.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-xl font-bold">⚽ ملاعب فيها مواعيد متاحة اليوم</h2>
              <ul className="grid gap-2 sm:grid-cols-2">{res.slots.map((s, i) => (
                <li key={i}><Link href={`/g/${s.slug}`} className="flex justify-between rounded-xl bg-surface px-4 py-3 text-sm ring-1 ring-white/10 hover:ring-accent"><span>{s.name_ar} <span className="text-muted">· {s.city}</span></span><span className="text-accent" dir="ltr">{hhmm(s.starts_at)}–{hhmm(s.ends_at)}</span></Link></li>))}</ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
