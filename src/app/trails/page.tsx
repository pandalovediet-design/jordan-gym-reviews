import type { Metadata } from "next";
import { TrailCard } from "@/components/TrailCard";
import { OrgCard } from "@/components/OrgCard";
import { listPlacesByCategory, listTrails } from "@/lib/queries";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "مسارات المشي والهايكنق والركض في الأردن",
  description: "دليل مسارات الهايكنق والمشي والركض في الأردن: المنطقة، الصعوبة، المسافة والموقع.",
  alternates: { canonical: "/trails" },
};

export default async function TrailsPage() {
  const [list, hiking, walking, parks] = await Promise.all([
    listTrails().catch(() => []),
    listPlacesByCategory("hiking-adventure").catch(() => []),
    listPlacesByCategory("walking-places").catch(() => []),
    listPlacesByCategory("parks").catch(() => []),
  ]);
  const sections = [
    { id: "hiking", title: "🥾 أماكن هايكنق ومغامرات", note: "أماكن خاصة أو منظَّمة", items: hiking },
    { id: "walking", title: "🚶 أماكن مشي", note: "ممشى ومضامير وغابات للمشي", items: walking },
    { id: "parks", title: "🌳 حدائق ومتنزهات عامة", note: "حدائق مفتوحة للجميع", items: parks },
  ].filter((x) => x.items.length > 0);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold">مسارات المشي والهايكنق والركض</h1>
      <p className="mb-6 text-sm text-muted">دليل للعرض فقط. تأكد من الطقس وخذ احتياطاتك قبل أي رحلة.</p>
      {list.length === 0 ? <p className="text-muted">المسارات قريباً.</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((t) => <TrailCard key={t.id} t={t} />)}</div>
      )}
      {sections.map((x) => (
        <section key={x.id} id={x.id} className="mt-12">
          <h2 className="text-xl font-extrabold">{x.title} <span className="text-sm font-normal text-muted">({x.items.length}) — {x.note}</span></h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{x.items.map((o) => <OrgCard key={o.id} org={o} />)}</div>
        </section>
      ))}
    </div>
  );
}
