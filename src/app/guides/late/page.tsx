import type { Metadata } from "next";
import Link from "next/link";
import { OrgCard } from "@/components/OrgCard";
import { listOpenLate } from "@/lib/open-now";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "نوادي مفتوحة لوقت متأخر في الأردن: رياضة بعد الإفطار",
  description: "نوادي رياضية بتسهر: بتسكّر الساعة 11 مساءً أو أكثر. مناسبة لرمضان ولأصحاب الدوام الطويل.",
  alternates: { canonical: "/guides/late" },
};

export default async function Late() {
  const items = await listOpenLate().catch(() => []);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-3 text-sm text-muted"><Link href="/guides">الأدلة</Link> / بتسهر</nav>
      <h1 className="text-3xl font-extrabold">🌙 نوادي بتسهر</h1>
      <p className="mt-2 text-muted">نوادي بتسكّر الساعة 11 مساءً أو بعد منتصف الليل بيوم واحد على الأقل بالأسبوع.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((o) => <OrgCard key={o.id} org={o} />)}</div>
      {items.length === 0 && <p className="mt-6 text-muted">ما في نتائج بعد.</p>}
    </div>
  );
}
