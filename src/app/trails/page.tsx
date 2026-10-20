import type { Metadata } from "next";
import { TrailCard } from "@/components/TrailCard";
import { listTrails } from "@/lib/queries";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "مسارات المشي والهايكنق والركض في الأردن",
  description: "دليل مسارات الهايكنق والمشي والركض في الأردن: المنطقة، الصعوبة، المسافة والموقع.",
  alternates: { canonical: "/trails" },
};

export default async function TrailsPage() {
  const list = await listTrails().catch(() => []);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold">مسارات المشي والهايكنق والركض</h1>
      <p className="mb-6 text-sm text-muted">دليل للعرض فقط. تأكد من الطقس وخذ احتياطاتك قبل أي رحلة.</p>
      {list.length === 0 ? <p className="text-muted">المسارات قريباً.</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((t) => <TrailCard key={t.id} t={t} />)}</div>
      )}
    </div>
  );
}
