import type { Metadata } from "next";
import Link from "next/link";
import { OrgCard } from "@/components/OrgCard";
import { searchOrgs } from "@/lib/queries";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "أرخص نوادي رياضية في الأردن: اشتراكات اقتصادية",
  description: "نوادي رياضية في الأردن باشتراكات بحد أقصى 30 دينار، مناسبة للطلاب والميزانية المحدودة.",
  alternates: { canonical: "/guides/budget" },
};

export default async function Budget() {
  const { items, total } = await searchOrgs({ type: "gym", maxPrice: 30, page: 1 }).catch(() => ({ items: [], total: 0 }));
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-3 text-sm text-muted"><Link href="/guides">الأدلة</Link> / نوادي اقتصادية</nav>
      <h1 className="text-3xl font-extrabold">💸 نوادي اقتصادية</h1>
      <p className="mt-2 text-muted">نوادي فيها خدمة بسعر 30 دينار أو أقل ({total}). السعر المعروض هو أقل سعر معلن.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((o) => <OrgCard key={o.id} org={o} />)}</div>
      {items.length === 0 && <p className="mt-6 text-muted">ما في نتائج بعد. <Link href="/search?type=gym" className="text-accent underline">تصفح كل النوادي</Link>.</p>}
      <p className="mt-8 text-sm"><Link href="/search?type=gym&max=50" className="text-accent underline">وسّع البحث إلى 50 دينار</Link></p>
    </div>
  );
}
