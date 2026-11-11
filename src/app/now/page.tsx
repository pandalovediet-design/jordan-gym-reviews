import type { Metadata } from "next";
import Link from "next/link";
import { NowLocate } from "@/components/NowLocate";
import { OrgCard } from "@/components/OrgCard";
import { listOpenNow } from "@/lib/open-now";
import { hhmm, ORG_TYPE_PLURAL } from "@/lib/format";
import { isOrgType } from "@/lib/queries";
import { PageHead, btn } from "@/components/PageHead";

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHead title="وين أتمرن هسا؟" note="الأماكن المفتوحة هسا والأقرب إلك. موقعك ما بنخزّنه، بنستخدمه للحساب بس." />
      <div className="flex flex-wrap gap-2">
        {([undefined, "gym", "sports_facility", "sports_health"] as const).map((x) => {
          const u = new URLSearchParams(); if (hasPos) { u.set("lat", String(lat)); u.set("lng", String(lng)); } if (x) u.set("type", x);
          return <Link key={x ?? "all"} href={`/now?${u}`} className={x === type ? btn.chipOn : btn.chip}>{x ? ORG_TYPE_PLURAL[x] : "الكل"}</Link>;
        })}
      </div>
      {!hasPos && <div className="mt-8"><NowLocate type={type} /></div>}
      {hasPos && !res && <p className="mt-8 text-red-300">تعذّر جلب النتائج، جرّب مرة ثانية.</p>}
      {res && (
        <>
          <div className="mt-4"><NowLocate type={type} label="حدّث موقعي" /></div>
          <section className="mt-8">
            <h2 className="mb-4 text-2xl font-bold">مفتوح هسا <span className="text-muted tabular-nums">{res.open.length}</span></h2>
            {res.open.length === 0 ? <p className="text-muted">ما في أماكن مفتوحة قريبة من موقعك هسا. جرّب <Link href="/guides/late" className="text-accent underline">أماكن بتسهر</Link>.</p> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{res.open.slice(0, 12).map((o) => <OrgCard key={o.id} org={o} />)}</div>)}
          </section>
          {res.slots.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-2xl font-bold">ملاعب فيها مواعيد متاحة اليوم</h2>
              <ul className="grid gap-2 sm:grid-cols-2">{res.slots.map((s, i) => (
                <li key={i}><Link href={`/g/${s.slug}`} className="flex justify-between rounded-xl bg-surface px-4 py-3 text-sm ring-1 ring-white/10 hover:ring-accent"><span className="font-semibold">{s.name_ar} <span className="font-normal text-muted">{s.city}</span></span><span className="font-display font-semibold tabular-nums" dir="ltr">{hhmm(s.starts_at)}–{hhmm(s.ends_at)}</span></Link></li>))}</ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
